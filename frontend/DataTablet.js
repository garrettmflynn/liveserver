//TODO: Disentangle this stuff to be more modular (so these fitbit dependencies can be removed)

export function randomId(tag = '') {
    return `${tag+Math.floor(Math.random()+Math.random()*Math.random()*10000000000000000)}`;
}

export class DataTablet {

    constructor(props={},threaded=false) {

        this.threaded = threaded;
        if (typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope) {
            this.threaded = 2;
        }

        this.data = {
            byTime:{}, //everything is arranged by time
            notes:{},
            events:{},
            sleep:{}, //or everything is arranged by type (then by time)
            food:{},
            hr:{},
            ppg:{},
            ecg:{},
            emg:{},
            eeg:{},
            fnirs:{}
        }

        Object.assign(this.data,props);

        this.dataSorts = new Map(); //what to do with data based on struct or data type

        this.setSort(
            'event',
            (dataObj,newdata,tablet=this)=>{
                if(!this.data.events[dataObj.timestamp])
                    this.data.events[dataObj.timestamp] = [dataObj];
                else this.data.events[dataObj.timestamp].push(dataObj);

                if(dataObj.event === 'sleep') {
                    if(!this.data.sleep[dataObj.timestamp])
                        this.data.sleep[dataObj.timestamp] = [dataObj];
                    else this.data.sleep[dataObj.timestamp].push(dataObj);
                }

                return dataObj;
            }
        );

        this.setSort(
            ['notes','note','link'],
            (dataObj,newdata,tablet=this) => {
                if(!this.data.notes[dataObj.timestamp])
                    this.data.notes[dataObj.timestamp] = [dataObj];
                else this.data.notes[dataObj.timestamp].push(dataObj);
                                    
                if(!this.data.byTime[dataObj.timestamp])
                    this.data.byTime[dataObj.timestamp] = [dataObj];
                else this.data.byTime[dataObj.timestamp].push(dataObj);

                return dataObj;
            }
        );

        //this.setSort();

        this.id = randomId('dataTablet');

        if(this.threaded === true) {
            let module = this.dynamicImport('magicworker');
            Promise.resolve(module).then((m) => {
                this.workermgr = new m.WorkerManager();
                this.workerId = this.workermgr.addWorker(m.magicworker);
    
                this.workermgr.runWorkerFunction('transferClassObject',{tabletClass:DataTablet.toString()},this.id,workerId);

                this.workermgr.addWorkerFunction('makeTablet',(self,args,origin) => {
                    self.tablet = new self.tabletClass(args[0]);

                    self.tablet.onSorted = (newdata) => {
                        postMessage({foo:'onSorted',output:newdata});
                    }
                    return true;
                });

                this.workermgr.addWorkerFunction('runSort',(self,args,origin) => {
                    if(Array.isArray(args[0])) {
                        args.forEach((arg) => {
                            self.tablet.runSort(...arg);
                        });
                    } else {
                        self.tablet.runSort(...args);
                    }
                    return true;
                });

                this.workermgr.addWorkerFunction('setSort',(self,args,origin) => {
                    self.tablet.setSort(...args);
                    return true;
                });

                this.workermgr.addWorkerFunction('getSort',(self,args,origin) => {
                    if(Array.isArray(args)) {
                        let results = [];
                        args.forEach((arg) => {
                            let sort = self.tablet.getSort(arg);
                            if(typeof sort === 'function') sort = sort.toString();
                            results.push(sort);
                        });
                        return results;
                    } 
                });

                this.workermgr.runWorkerFunction('makeTablet', props, this.id, this.workerId);
    
            });
           
        }


    }

    
    dynamicImport = async (url) => {

        let getImportFunc = `async (url) => {return await import(url)}`
        let getImport = eval(`(${getImportFunc})`);
        let module = await getImport(url)
        return module;
    }

    runSort(key,dataObj={},newdata=[],tablet=this) {
        if(this.threaded === false) {
            let result;
            let sort = this.getSort(key);
            if(sort) result = sort(dataObj,newdata,tablet);
            else return false;
        } else {
            this.workermgr.runWorkerFunction('runSort',[key,dataObj,newdata],this.id,this.workerId);
        }
    }

    setSort(key,response=(dataObj)=>{return true;}) {
        if(this.threaded === false) {
            if(Array.isArray(key))
                key.forEach((k) => {this.dataSorts.set(k,response);});
            else
                this.dataSorts.set(key,response);
        } else {
            this.workermgr.runWorkerFunction('setSort',[key,response.toString()],this.id,this.workerId);
        }
    }

    getSort(key) {
        if(this.threaded === false) {
            return this.dataSorts.get(key);
        } else {
            return this.workermgr.runWorkerFunction('getSort',[key],this.id,this.workerId);
        }
    }

    /* Barebones struct format, append any additional props */
    Struct(additionalProps={}, structType='struct', parentStruct=undefined,parentUser=undefined) {
        let struct = {
            _id: randomId(structType+'defaultId'),   //random id associated for unique identification, used for lookup and indexing
            structType: structType,     //this is how you will look it up by type in the server
            ownerId: parentUser?._id,     //owner user
            timestamp: Date.now(),      //date of creation
            parent: {structType:parentStruct?.structType,_id:parentStruct?._id}, //parent struct it's associated with (e.g. if it needs to spawn with it)
        }

        if(!parentStruct?._id) delete struct.parent;
        if(Object.keys(additionalProps).length > 0) Object.assign(struct,additionalProps);
        return struct;
    }

    async sortStructsIntoTable(datastructs=[]) {
        //sort by timestamp 
        let ascending = function(a,b) { return a.timestamp - b.timestamp; }
        /**
         * let descending = function(a,b) { return b.timestamp-a.timestamp };
         */
        datastructs.sort(ascending); //reorder

        let newdata = [];

        //now distribute into data
        for(let i = 0; i < datastructs.length; i++) {
            let struct = datastructs[i];
            if(!struct.timestamp) continue;
            let timestamp = struct.timestamp;

            if(!this.data.byTime[timestamp])
                this.data.byTime[timestamp] = [struct];
            else this.data.byTime[timestamp].push(struct);

            if(struct.structType === 'dataInstance') {
                //we should sort instanced fitbit data into timestamped bins with markers for different resolutions
                //other data in dataInstance.data array will be like {dataType:'notes',data:'abcdefg'} 
                struct.data.forEach(async (dat) => {
                    if(typeof dat === 'object' && !Array.isArray(dat)) {
                        let typ = dat.dataType;
                        dat.ownerId = struct.ownerId;
                        if(!dat.timestamp) dat.timestamp = timestamp;
                        if(typ) {
                            let sorted = this.runSort(typ,dat,newdata,this);
                            if(!sorted) { //generic
                                if(!this.data[typ]) this.data[typ] = {};
    
                                dat.timestamp = timestamp;
                                if(!this.data[typ][timestamp]) 
                                    this.data[typ][timestamp] = [dat];
                                else this.data[typ][timestamp].push(dat);
                                if(!this.data.byTime[timestamp])
                                    this.data.byTime[timestamp] = [dat];
                                else this.data.byTime[timestamp].push(dat); 
                                this.onUpdate(timestamp, dat);
                                newdata.push(dat);  
                            }
                            if(sorted) {
                                if(sorted.constructor?.name !== 'Promise') {
                                    this.onUpdate(timestamp, sorted);
                                    newdata.push(sorted); 
                                }
                            }
                        }
                    }
                });
            }
            else {
                let sorted = this.runSort(struct.structType,struct,newdata,this);
                if(!sorted) { //generic
                    let typ = struct.structType;
                    if(!this.data[typ]) this.data[typ] = {};
                    if(!this.data[typ][timestamp])
                        this.data[typ][timestamp] = [struct];
                    else this.data[typ][timestamp].push(struct); 
                    this.onUpdate(timestamp, struct);
                    newdata.push(struct);
                } else {
                    this.onUpdate(timestamp, sorted);
                    newdata.push(sorted);
                }
                
            }
            
        }

        for(const prop in this.data) {
            this.data[prop] = this.sortObjectByPropName(this.data[prop]); //should arrange the object by timestamp
        }

        this.onSorted(newdata);
    }

    onUpdate(timestamp, struct, data=this.data) {}

    onSorted(newdata=[]) {}

    getDataByTimestamp(timestamp,ownerId) {
        
            let result = this.data.byTime[timestamp];
            if(ownerId && result) result = result.filter((o)=>{if(!ownerId) return true; else if(ownerId === o.ownerId) return true;});
            if (this.threaded === 2) {

            } else {
                return result;
            } 
    }

    getDataByTimeRange(begin,end,type,ownerId) {
       
            let result = {};
            if(type) {
                for(const key in this.data[type]) {
                    let t = parseInt(key);
                    if(t > begin && t < end){
                        result[key] = [...this.data[type][key]];
                    }
                }
                if(type === 'sleep') {
                    result = this.filterSleepResults(result);
                }
                
            }
            else {
                for(const key in this.data.byTime) {
                    let t = parseInt(key);
                    if(t > begin && t < end){
                        result[key] = [...this.data.byTime[key]];
                    }
                }
            }
            if(ownerId && result) {
                for(const key in result) {
                    let popidx = [];
                    result[key] = result[key];
                    result[key].forEach((o,i) => {
                        if(o.ownerId !== ownerId) {
                            popidx.push(i);
                        }
                    });
                    popidx.reverse().forEach((idx) => {
                        result[key].splice(idx,1);
                    });
                    if(result[key].length === 0) delete result[key];
                }
            }

            if(this.threaded === 2) {

            } else {
                return result;
            }
    }

    getDataByType(type,timestamp,ownerId) {
        if(!this.data[type]) return undefined;

        let result = {...this.data[type]};
        if(timestamp) result = [...result[timestamp]];

        if(ownerId && result) {
            for(const key in result) {
                let popidx = [];
                result[key] = [...result[key]];
                result[key].forEach((o,i) => {
                    if(o.ownerId !== ownerId) {
                        popidx.push(i);
                    }
                });
                popidx.reverse().forEach((idx) => {
                    result[key].splice(idx,1);
                });
                if(result[key].length === 0) delete result[key];
            }
        }
        if(type === 'sleep') {
            result = this.filterSleepResults(result);
        }
        if(this.threaded === 2) {

        } 
        else {
            return result;
        }
        
    }

    filterSleepResults(unfiltered = {}) {
        //need to check if any events are overlapping with fitbit data then pop any fitbit data, assuming events are more accurate
        let events = [];
        for(const key in unfiltered) {
            unfiltered[key] = [...unfiltered[key]]; //copy result
            events.push(...unfiltered[key].filter((o) => {
                if(o.structType === 'event') return true;
            }));
        }

        events.forEach((ev) => {
            let foundidx = undefined;
            for(const key in unfiltered) {
                unfiltered[key].forEach((o) => {
                    //assume sleep data within 12 hours and longer than 2 hours is to be replaced
                    if(o.structType === 'fitbitsleep' && ev.startTime && ev.endTime) {
                        if(Math.abs(o.startTime - ev.startTime) < 1000*12*3600 && Math.abs(o.endTime - ev.endTime) < 1000*12*3600 && (ev.endTime - ev.startTime) > 1000*2*3600) {
                            foundidx = i;
                            return true;
                        }  
                    }
                }); 
                if(foundidx) unfiltered[key].splice(foundidx,1);
            }   
        });
        
        let result = unfiltered;
        return result;
    } 

    sortObjectByPropName(object) {

        const ordered = Object.keys(object).sort().reduce(
            (obj, key) => { 
              obj[key] = object[key]; 
              return obj;
            }, 
            {}
          );
    
        return ordered;
    }

}