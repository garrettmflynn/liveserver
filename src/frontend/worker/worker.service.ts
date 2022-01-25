//Main thread control of workers

import { Router, Service } from "src/common";

import worker from './server.worker'

//Runs on main thread
export class WorkerService extends Service {

    name:string='worker';
    defaultRoutes:any[];
    Router:Router;
    url:any;
    responses = [];
    workers = [];
    threads = 1;
    threadrot = 0;
    toResolve = {};
    routes = [

    ];

    constructor(Router:Router, url:string, nThreads:number=0) {
        super();

        this.Router = Router;
        this.threads = nThreads; 
        this.url = url;
  
        let i = 0;
  
        while(i < nThreads){
          this.addWorker(); 
          i++;
        }
  
    }
  
      //return the worker by id, or the first worker (e.g. the default one)
    getWorker(id) {
        if(id) return this.workers.find((o) => {if(o.id === id) return true}).worker;
        else return this.workers[0].worker;
    }
  
    addWorker = (url=this.url, type:WorkerType = 'module') => {
  
          let newWorker;
          try {
            if (!url) newWorker = (worker as any)();
            else {
              if (!(url instanceof URL)) url = new URL(url, import.meta.url)
              newWorker = new Worker(url, {name:'worker_'+this.workers.length, type});
            }
          } catch (err) {
            //   try { //blob worker which works in principle but gpujs doesn't want to transfer correctly, how do we fix it?  
            //     if(!document.getElementById('blobworker')) {
            //       document.head.insertAdjacentHTML('beforeend',`
            //         <script id='blobworker' type='javascript/worker'>
            //           //gotta handle imports
            //           self.onmessage = (event) => {
            //                console.log(event);
            //            }
            //         </script>
            //       `);
            //     }
            //     let blob = new Blob([
            //       document.querySelector('#blobworker').textContent
            //     ], {type:"text/javascript"});
            //     console.log("Blob worker!");
            //     newWorker = new Worker(window.URL.createObjectURL(blob));
            //   } catch(err3) { console.error(err3); }      
          }
          finally {
            if (newWorker){
  
            let id = "worker_"+Math.floor(Math.random()*10000000000);
              
            this.workers.push({worker:newWorker, id:id});

            newWorker.onmessage = (ev) => {
  
                var msg = ev.data;
  
                // Resolve 
                let toResolve = this.toResolve[ev.data.callbackId];
                if (toResolve) {
                  toResolve(msg.output);
                  delete this.toResolve[ev.data.callbackId]
                }
  
                // Run Response Callbacks
                this.responses.forEach((foo,_) => {
                  if(typeof foo === 'object') foo.callback(msg);
                  else if (typeof foo === 'function') foo(msg);
                });
            };
  
            newWorker.onerror = (e) => {
              console.error(e)
            }
  
            console.log("server threads: ", this.workers.length);
            
            newWorker.postMessage(JSON.stringify({workerId:id}));

            return id; //worker id
          } else return;
        }
    }
  
      //automated responses
    addCallback(name='',callback=(result)=>{}) {
        if(name.length > 0 && !this.responses.find((o)=>{if(typeof o === 'object') {if(o.name === name) return true;} return})) {
          this.responses.push({name:name,callback:callback});
        }
    }
  
      //remove automated response by name
    removeCallback(nameOrIdx='') {
        if(nameOrIdx.length > 0) {
          let idx;
          if(this.responses.find((o,i)=>{if(typeof o === 'object') {if(o.name === nameOrIdx) { idx = i; return true;}}  return})) {
            if (idx) this.responses.splice(idx,1);
          }
        } else if (typeof nameOrIdx === 'number') {
          this.responses.splice(nameOrIdx,1);
        }
    }
  
      
    //run from the list of callbacks on an available worker
    async run(functionName,args,workerId,origin,transfer,callback=(result)=>{}) {
        if(functionName) {
          if(functionName === 'transferClassObject') {
            if(typeof args === 'object' && !Array.isArray(args)) {
              for(const prop in args) {
                if(typeof args[prop] === 'object' && !Array.isArray(args[prop])) args[prop] = args[prop].toString();
              }
            }
          }
          let dict = {foo:functionName, args:args, origin:origin};
          return await this.post(dict,workerId,transfer,callback);
        }
    }

    
    post = (input, workerId, transfer, callback=(result)=>{}) => {

        return new Promise(resolve => {
          //console.log('posting',input,id);
          if (Array.isArray(input.input)){
          input.input = input.input.map((v) => {
            if (typeof v === 'function') return v.toString();
            else return v;
          })} 
  
          const resolver = (res) => 
            {    
                if (callback) {
                    callback(res);
                }
                resolve(res);
            }
  
          input.callbackId = Math.floor(1000000 * Math.random());
          this.toResolve[input.callbackId] = resolver;
  
          if(workerId == null) {
              const worker = this.workers?.[this.threadrot]?.worker
              if (worker){
                worker.postMessage(input,transfer);
                if(this.threads > 1){
                    this.threadrot++;
                    if(this.threadrot >= this.threads){
                        this.threadrot = 0;
                    }
                }
              }
          }
          else{
              this.workers.find((o)=>{
                  if(o.id === workerId) {
                      o.worker.postMessage(input,transfer); 
                      return true;
                    } else return;
              });
          }
  
        })
      }

      terminate(workerId) {
        if(!workerId) {
          this.workers.forEach((o) => o.worker.terminate()); //terminate all
        }
        else {
          let idx;
          let found = this.workers.find((o,i)=>{
              if(o.id === workerId) {
                  idx=i;
                  o.worker.terminate();
                  return true;
              } else return
          });
          if(found && idx) {
              this.workers.splice(idx,1);
              return true;
          } else return false;
        }
      }
  
      close = this.terminate;

    //this creates a message port so particular event outputs can directly message another worker and save overhead on the main thread
    establishMessageChannel(
        worker1Id,
        worker2Id,
    ) 
    {
        let channel = new MessageChannel();
        let port1 = channel.port1;
        let port2 = channel.port2;

        //transfer the ports and hook up the responses 
        this.run('addport',[port1],worker1Id,this.Router.id,[port1]);
        this.run('addport',[port2],worker2Id,this.Router.id,[port2]);

    }
}
