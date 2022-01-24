import osc from "osc"
import { RouteConfig } from "src/common/general.types"
import { DONOTSEND } from "@brainsatplay/liveserver-common/Router";
import { Service } from "@brainsatplay/liveserver-common/Service";

// Garrett Flynn, AGPL v3.0
// TODO: Break OSC into another network protocol ( totally untested )

export class OSCService extends Service {
    name = 'osc'

    ports = []   

    constructor(){
        super()

        this.routes = [
            { 
                route:'startOSC',
                callback: async (self,args) => {
                    const res = await this.add(args[0],args[1],args[2],args[3])
                    return res
                }
              },
              { 
                route:'sendOSC',
                callback:(self,args,origin) => {
                    const u = self.USERS.get(origin)
                    if (!u) return false
                  if (args.length > 2) u.osc.send(args[0],args[1],args[2]);
                  else this.send(args[0]);
                  return DONOTSEND;
                }
              },
              { 
                route:'stopOSC',
                callback:(self,args,origin) => {
                  if(this.remove(args[0], args[1])) return true;
                }
              }
        ]
    }

    info(){
        // var ipAddresses = getIPAddresses();
        let info = []
        this.ports.forEach((p) => {
            info.push({
                localAddress: p.options.localAddress, 
                localPort: p.options.localPort,
                remoteAddress: p.options.remoteAddress, 
                remotePort: p.options.remotePort
            })
        });
        return info;
    }

    send(dict, localAddress?, localPort?, remoteAddress?, remotePort?) {
        if (!localAddress || !localPort || !remoteAddress || !remotePort){
            this.ports.forEach(o => {
                o.send(this.encodeMessage(dict))
            });
            return true;
        } else {
            let found = this.ports.find((o,i) => {
                if (o.options.localAddress === localAddress && o.options.localPort === localPort && o.options.remotePort === remotePort && o.options.remoteAddress === remoteAddress) {
                    o.close()
                    this.ports.splice(i,1)
                    return true
                }
            })
            if(found) return found;
            else return undefined;
        }
    }

    encodeMessage(message){
        let bundle = {
            timeTag: osc.timeTag(0),
            packets: []
        }
        for (let key in message){
            let args = []
            if (!Array.isArray(message[key])) message[key] = [message[key]]
            message[key].forEach(v => {
                args.push({value: v})
            })
            bundle.packets.push({route: `/brainsatplay/${key}`, message: message[key]})
        }
        return bundle;
    }

    async add(localAddress="127.0.0.1",localPort=57121, remoteAddress=localAddress, remotePort=localPort) {

        return new Promise(resolve => {
        if (typeof localAddress === 'string' && typeof remoteAddress === 'string'){
            let port = new osc.UDPPort({
                localAddress,
                localPort,
                remoteAddress,
                remotePort
            });

            port.on("ready", () => {
                this.ports.push(port)
                resolve({route: 'oscInfo', message: port.options})
            });

            port.on("error", (error) => {
                resolve({route: 'oscError', message:  error.message})
                this.notify({route: 'oscError', message: error.message}, true)
            });

            port.on("message", (o) => {
                this.notify({route: 'oscData', message: o}, true)
            });

            port.on("close", (message) => {
                this.notify({route: 'oscClosed', message}, true)
            })
            
            port.open();
        }
    })
    }

    remove(localAddress?, localPort?, remoteAddress?, remotePort?) {
        if (!localAddress || !localPort || !remoteAddress || !remotePort){
            this.ports.forEach(o => {
                o.close()
            })
            this.ports = [];
            return true;
        } else {
            let found = this.ports.find((o,i) => {
                if (o.options.localAddress === localAddress && o.options.localPort === localPort && o.options.remotePort === remotePort && o.options.remoteAddress === remoteAddress){
                    o.close()
                    this.ports.splice(i,1)
                    return true
                }
            })
            if(found) return true;
            else return undefined;
        }
    }
}

export default OSCService