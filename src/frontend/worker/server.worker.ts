//The worker thread. 
//This can run all of the web interfaces as well as serial interfaces. 
//The web interfaces need their own env setup e.g. mongoose or express instances
//if on frontend, the workers can't 

import { SessionsService } from "src/backend";
import { UnsafeService   } from "src/backend";
import { DatabaseService } from "src/backend";
//can import all

import { parseFunctionFromText, randomId, Router, Service } from "src/common";



export class ServerWorker extends Service {

    id=randomId('worker');
    Router:Router;
    responses=[];

    routes = [
        {
            route:'addservice',
            callback:(self,args,origin)=>{
                //provide service name and setup arguments (e.g. duplicating server details etc)
            }
        },
        {
            route:'removeservice',
            callback:(self,args,origin)=>{
                
            }
        },
        { //MessageChannel port, it just runs the whole callback system to keep it pain-free, while allowing messages from other workers
            route: 'addport', 
            callback: (self, args, origin) => { //args[0] = eventName, args[1] = case, only fires event if from specific same origin
                let port = args[1]; //messageport 
                this[`${origin}`] = port; //message ports will have the origin marked as the worker id 
                port.onmessage = onmessage; //port messages get processed generically, an argument will denote they are from a worker 
            }
        },
        {
            route:'addcallback',
            callback:(self,args,origin)=>{
                if(!args[0] && !args[1]) return;
                let func = parseFunctionFromText(args[1]);
                if(func) this.addCallback(args[0],func);
                return true;
            }
        },
        {
            route:'removecallback',
            callback:(self,args,origin)=>{
                if(args[0]) this.removeCallback(args[0]);
                return true;
            }
        },
        {
            route:'run',
            callback:(self,args,origin)=>{
                let c = this.responses.find((o) => {
                    if(o.name === args[0]) {
                        return true;
                    }
                });
                if(c && args[1]) return c.callback(args[1]); 
            }
        }
    ]

    constructor(Router:Router) {
        super();

        this.Router = Router;
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
}

let router = new Router({debug:false});
let worker = new ServerWorker(router);
router.load(new ServerWorker(router));

//message from main thread or port
self.onmessage = async (event) => {
    //do the thing with the router
    if(event.data.workerId) worker.id = event.data.workerId;

    if(event.data) worker.notify(event.data);
    //if origin is a message port, pass through the port
    //if origin is main thread, pass to main thread
    //else pass to respective web apis

    // Run Response Callbacks
    if(!event.data.route.includes('run')) {
        worker.responses.forEach((foo,_) => {
            if(typeof foo === 'object') foo.callback(event.data);
            else if (typeof foo === 'function') foo(event.data);
        });
    }
}

export default self;