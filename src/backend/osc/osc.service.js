import osc from "osc"

// Garrett Flynn, AGPL v3.0
class OSCManager{
    constructor(ws){
        this.socket = ws
        this.ports = []     
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

    send(dict, localAddress, localPort, remoteAddress, remotePort) {
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

    encodeMessage(msg){
        let bundle = {
            timeTag: osc.timeTag(0),
            packets: []
        }
        for (let key in msg){
            let args = []
            if (!Array.isArray(msg[key])) msg[key] = [msg[key]]
            msg[key].forEach(v => {
                args.push({value: v})
            })
            bundle.packets.push({address: `/brainsatplay/${key}`, args: msg[key]})
        }
        return bundle;
    }

    add(localAddress="127.0.0.1",localPort=57121, remoteAddress=localAddress, remotePort=localPort) {

        let port = new osc.UDPPort({
            localAddress,
            localPort,
            remoteAddress,
            remotePort
        });

        port.on("ready", () => {
            this.ports.push(port)
            this.socket.send(JSON.stringify({msg:'oscInfo', oscInfo: this.info()}))
        });

        port.on("error", (error) => {
            if (error.code === 'EADDRINUSE') {this.socket.send(JSON.stringify({msg:'oscInfo', oscInfo: this.info()}))}
            else this.socket.send(JSON.stringify({msg:'oscError', oscError: error.message}))
        });

        port.on("message", (oscMsg) => {
            this.socket.send(JSON.stringify({msg:'oscData', oscData: oscMsg, address:remoteAddress, port:remotePort}));
        });

        port.on("close", (msg) => {})
        
        port.open();

        return true;
    }

    remove(localAddress, localPort, remoteAddress, remotePort) {
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

export { OSCManager }
export default OSCManager