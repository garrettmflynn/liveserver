import { parseFunctionFromText } from "../../common/parse.utils";
import { Service } from "liveserver-router";

// Garrett Flynn and Joshua Brewster, AGPL v3.0
export class UnsafeBackend extends Service {
    name = 'unsafe'
    routes = [
        { //add a local function, can implement whole algorithm pipelines on-the-fly
          route: 'addfunc', callback: async (self, args) => { //arg0 = name, arg1 = function string (arrow or normal)

            let newFunc = (typeof args[1] === 'string') ? parseFunctionFromText(args[1]) : args[1]
  
            let newCallback = { route: args[0], callback: newFunc };
  
            self.addRoute(newCallback)

            return true;
          }
        },
        {
          route:'runfunc', //pass a stringified function, parse, and run it. Use second argument for the function argument array. Good for testing
          callback:(self,args,origin)=>{
              if(args[0] && args[1]) {
                  let func = parseFunctionFromText(args[0]);
                  try{
                      let result = func(self,args[1],origin);
                      return result;
                  } catch(err) {return err;}          
              }
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
        }
        ]

    constructor(){
        super()
    }

}

export default UnsafeBackend