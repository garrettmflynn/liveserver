import { parseFunctionFromText } from "src/common";
import { Service } from "@brainsatplay/liveserver-common/Service";

// Garrett Flynn and Joshua Brewster, AGPL v3.0
export class UnsafeService extends Service {
    name = 'unsafe'
    routes = [
        { //add a local function, can implement whole algorithm pipelines on-the-fly
          route: 'addfunc', callback: async (self, args) => { //arg0 = name, arg1 = function string (arrow or normal)

            let newFunc = (typeof args[1] === 'string') ? parseFunctionFromText(args[1]) : args[1]
  
            let newCallback = { route: args[0], callback: newFunc };
  
            self.addRoute(newCallback)
            // self.routes[newCallback.route] = newCallback // TODO: Update EventSources subscribed to this event...
            
            // Trigger Subscriptions to Receive Update from Routes
            // console.log('SUPER ARTIFICIAL WAY TO NOTIFY SUBSCRIBERS')
            // const message = await self.runCallback('routes')
            // self.triggerSubscriptions({route: 'routes', message})
            return true;
          }
        },
        { //set locally accessible values, just make sure not to overwrite the defaults in the callbackManager
          route: 'setValues', callback: (self, args) => {
            if (typeof args === 'object') {
              Object.keys(args).forEach((key) => {
                self[key] = args[key]; //variables will be accessible in functions as this.x or this['x']
              });
              return true;
            } else return false;
          }
        },
        { //append array values
          route: 'appendValues', callback: (self, args) => {
            if (typeof args === 'object') {
              Object.keys(args).forEach((key) => {
                if(!self[key]) self[key] = args[key];
                else if (Array.isArray(args[key])) self[key].push(args[key]); //variables will be accessible in functions as this.x or this['x']
                else self[key] = args[key];
              });
              return true;
            } else return false;
          }
        },
        { //for use with transfers
          route: 'setValuesFromArrayBuffers', callback: (self, args) => {
            if (typeof args === 'object') {
              Object.keys(args).forEach((key) => { 
                if(args[key].__proto__.__proto__.constructor.name === 'TypedArray') self[key] = Array.from(args[key]);
                else self[key] = args[key];
              });
              return true;
            } else return false;
          }
        },
        { //for use with transfers
          route: 'appendValuesFromArrayBuffers', callback: (self, args) => {
            if (typeof args === 'object') {
              Object.keys(args).forEach((key) => {
                if(!self[key] && args[key].__proto__.__proto__.constructor.name === 'TypedArray') self[key] = Array.from(args[key]);
                else if(!self[key]) self[key] = args[key];
                else if(args[key].__proto__.__proto__.constructor.name === 'TypedArray') self[key].push(Array.from(args[key]));
                else if(Array.isArray(args[key])) self[key].push(args[key]); //variables will be accessible in functions as this.x or this['x']
                else self[key] = args[key];
              });
              return true;
            } else return false;
          }
        },
        { //parses a stringified class prototype (class x{}.toString()) containing function methods for use on the worker
          route: 'transferClassObject', callback: (self, args) => {
            if (typeof args === 'object') {
              Object.keys(args).forEach((key) => {
                if(typeof args[key] === 'string') {
                  let obj = args[key];
                  if(args[key].indexOf('class') === 0) obj = eval('('+args[key]+')');
                  self[key] = obj; //variables will be accessible in functions as this.x or this['x']
                  //console.log(self,key,obj);
                  if (self.threeUtil) self.threeUtil[key] = obj;
                }
              });
              return true;
            } else return false;
          }
        },
        { //add an event to the event manager, this helps building automated pipelines between threads
            route: 'addevent', callback: (self, args, origin) => { //args[0] = eventName, args[1] = case, only fires event if from specific same origin
              self.EVENTSETTINGS.push({ eventName: args[0], route: args[1], port:args[2], origin: origin });
              //console.log(args);
              if(args[2]){ 
                let port = args[2];
                port.onmessage = onmessage; //attach the port onmessage event
                this[args[0]+'port'] = port;
                return true;
              }
              return false;
            }
          },
          { //internal event subscription, look at Event for usage, its essentially a function trigger manager for creating algorithms
            route: 'subevent', callback: (self, args, origin) => { //args[0] = eventName, args[1] = response function(self,args,origin) -> lets you reference self for setting variables
              if(typeof args[0] !== 'string') return false;
              
              let response = (typeof args[1] === 'string') ? parseFunctionFromText(args[1]) : args[1]
              let eventSetting = self.checkEvents(args[0]); //this will contain the port setting if there is any
              //console.log(args, eventSetting)
              return self.EVENTS.subEvent(args[0], (output) => {
                response(self,output,origin,eventSetting?.port,eventSetting?.eventName); //function wrapper so you can access self from the event subscription
              });
            }
          },
          { //internal event unsubscribe
            route: 'unsubevent', callback: (self, args) => { //args[0] = eventName, args[1] = case, only fires event if from specific same origin
              return self.EVENTS.unsubEvent(args[0], args[1]);
            }
          }
        ]

    constructor(){
        super()
    }

}

export default UnsafeService