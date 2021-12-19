//TODO: Disentangle this stuff to be more modular (so these fitbit dependencies can be removed)

export class DataTablet {

    constructor(platform) {
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

        this.platform = platform;

        this.dataSorts = new Map(); //what to do with data based on struct or data type
        this.setSort(
            'event',
            (dataObj,newdata,tablet)=>{
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
            (dataObj,newdata,tablet) => {
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


    }

    runSort(key,dataObj={},newdata=[],tablet=this) {
        let result;
        let sort = this.getSort(key);
        if(sort) result = sort(dataObj,newdata,tablet);
        else return false;
    }

    setSort(key,response=(dataObj)=>{return true;}) {
        if(Array.isArray(key))
            key.forEach((k) => {this.dataSorts.set(k,response);});
        else
            this.dataSorts.set(key,response);
    }

    getSort(key) {
        return this.dataSorts.get(key);
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
        return result;
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
        return result;
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
        
        return result;
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