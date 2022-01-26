import DataChannel from './DataChannel'

/*

Known Bugs
- Adding a DataChannel after an RTCPeerConnection has already been opened will not work reliably (see addDataTracks)

*/

import { SubscriptionService } from 'liveserver-router';
import { UserObject, MessageObject } from 'liveserver-router/general.types';

export class WebRTCClient extends SubscriptionService {

    name = 'webrtc'
    service = 'WebRTCService'

    config: RTCConfiguration
    peers: Map<string,RTCPeerConnection> = new Map()
    dataChannelQueueLength: number = 0
    dataChannels: Map<string,any> = new Map()
    rooms: Map<string,any> = new Map() // TODO: Remove
    sources: Map<string,any> = new Map()
    toResolve: {[x:string]: any} = {} // for tracking DataChannel callbacks
    hasResolved: {[x:string]: DataChannel} = {} // for tracking DataChannel callbacks

    routes = [

        // Room Management
        {
            route: 'rooms',
            callback: (message:any) => {
                     message.forEach((room) => {this.rooms.set(room.uuid, room)})
                    this.dispatchEvent(new CustomEvent('room', {detail: {rooms: message}}))
            }
        },
        {
            route: 'roomadded',
            callback: (message:any) => {
                this.rooms.set(message.uuid, message)
                this.dispatchEvent(new CustomEvent('room', {detail: {room: message, rooms: Array.from(this.rooms, ([_,value]) => value)}}))
            }
        },

        // else if (res.cmd === 'roomclosed') this.dispatchEvent(new CustomEvent('roomclosed'))


        // Default WebRTC Commands
        {
            route: 'answer',
            callback: (message:any) => {
                let peer = this.peers.get(message.id)
                if (peer) peer.setRemoteDescription(message.msg);
            }
        },
        {
            route: 'candidate',
            callback: (message:any) => {
                let peer = this.peers.get(message.id)
                let candidate = new RTCIceCandidate(message.msg)
                if (peer)  peer.addIceCandidate(candidate).catch((e:Error) => console.error(e)); // thrown multiple times since initial candidates aren't usually appropriate
            }
        },
        {
            route: 'offer',
            callback: (message:any, id) => {
                console.log('MESSAGE', message)
                this.onoffer(message, message.msg, id)
            }
        },

        // Extra Commands
        {
            route: 'disconnectPeer',
            callback: (message:any) => {
                this.closeConnection(message, this.peers.get(message.id))
            }
        },
        {
            route: 'connect',
            callback: async (message:any) => {
                this.createPeerConnection(message) // connect to peer
                for (let arr of this.sources) {
                    let dataTracks = arr[1].getDataTracks()
                    await this.addDataTracks(message?.id, dataTracks) // add data tracks from all sources
                }            
            }
        }
    ]

    get [Symbol.toStringTag]() { return 'WebRTCClient' }

    constructor(source, iceServers=[{
        urls: ["stun:stun.l.google.com:19302"]
    }]){
        super()

        this.addSource(source) // Add MediaStream / DataStream

        this.config = {
            iceServers
          };

          /**
           * e.g. https://developer.mozilla.org/en-US/docs/Web/API/RTCIceServer/urls
            let myPeerConnection = new RTCPeerConnection({
                iceServers: [
                    {
                    urls: ["turns:turnserver.example.org", "turn:turnserver.example.org"],
                    username: "webrtc",
                    credential: "turnpassword"
                    },
                    {
                    urls: "stun: stunserver.example.org"
                    }
                ]
            });
           */

        // ---------------------------- Event Listeners ----------------------------

        this.addEventListener('peerdisconnect', ((ev:CustomEvent) => { this.peers.delete(ev.detail.id)}) as EventListener )
        this.addEventListener('peerdisconnect', ((ev:CustomEvent) => { this.onpeerdisconnect(ev)}) as EventListener )
        this.addEventListener('peerconnect', ((ev:CustomEvent) => { this.peers.set(ev.detail.id, ev.detail.peer) }) as EventListener )
        this.addEventListener('peerconnect', ((ev:CustomEvent) => { this.onpeerconnect(ev)}) as EventListener )
        this.addEventListener('datachannel', ((ev:CustomEvent) => { this.ondatachannel(ev) }) as EventListener )
        this.addEventListener('room', ((ev:CustomEvent) => { this.onroom(ev)}) as EventListener )
        this.addEventListener('track', ((ev:CustomEvent) => { this.ontrack(ev) }) as EventListener )
        // this.addEventListener('trackremoved', ((ev:CustomEvent) => { this.ontrackremoved(ev)}) as EventListener )
        this.addEventListener('roomclosed', ((ev:CustomEvent) => { this.onroomclosed(ev)}) as EventListener )
    }

    onpeerdisconnect = (_:CustomEvent) => {}
    onpeerconnect = (_:CustomEvent) => {}
    ondatachannel = (_:CustomEvent) => {}
    onroom = (_:CustomEvent) => {}
    ontrack = (_:CustomEvent) => {}
    // ontrackremoved = (ev:CustomEvent) => {}
    onroomclosed = (_:CustomEvent) => {}

    // Add DataStreamTracks from DataStream (in series)
    addDataTracks = async (id:string, tracks:any[]) => {
        for (let track of tracks) {
            await this.openDataChannel({name: `DataStreamTrack${this.dataChannelQueueLength}`, peer:id, reciprocated: false}).then((o: DataChannel) => track.subscribe(o.sendMessage)) // stream over data channel
        }
    }

    addSource = async (source?:any) => {
        if (source){
            this.sources.set(source.id, source)
            source.addEventListener('track', ((ev:CustomEvent) => {
                let kind = ev.detail.kind
                if (!kind || (kind !== 'video' && kind !== 'audio')){
                    for (let arr of this.peers) {
                        this.addDataTracks(arr[0], [ev.detail])
                    }
                }
            }) as EventListener)
        }
    }


    // Note: Will run on initial offer and subsequent renegotiations
    onoffer = async (peerInfo:UserObject, sdp:RTCSessionDescriptionInit, peerId:string) => {
        let myPeerConnection = await this.createPeerConnection(peerInfo, peerId)
        const description = new RTCSessionDescription(sdp);
        myPeerConnection.setRemoteDescription(description).then(() => myPeerConnection.createAnswer()).then(sdp => myPeerConnection.setLocalDescription(sdp))
        .then(() => {
            this.notify({route: 'answer', message: [peerInfo.id, myPeerConnection.localDescription]})
        });
    }

    handleNegotiationNeededEvent = (localConnection:RTCPeerConnection, id:string) => {
        localConnection.createOffer()
        .then(sdp => localConnection.setLocalDescription(sdp))
        .then(() => {
            this.notify({route: 'offer', message: [id, localConnection.localDescription]})
        });
    }

    handleICECandidateEvent = (event: RTCPeerConnectionIceEvent, id: string) => {
        if (event.candidate) this.notify({route: 'candidate', message: [id, event.candidate]})
    }

    handleTrackEvent = (event:RTCTrackEvent, id:string) => {
        if (event.track){
            let track = event.track
            this.dispatchEvent(new CustomEvent('track', {detail: {track, id}}))
            return true
        } else return null
    }


    // NOTE: This data channel will always be the one that can send/receive information
    handleDataChannelEvent = async (ev:RTCDataChannelEvent, _:string) => {

        // Filter for Expected Channels (or allow all)
        // if (!this.channels || this.channels.includes(ev.channel.label)){

            // Receive Data from Remote
            let o = await this.openDataChannel({channel: ev.channel, callback: (msg, channel) => channel.addData(msg)}) as DataChannel
            const toResolve = this.toResolve[o.label]

            if (toResolve) {
                delete this.toResolve[o.label]
                toResolve(o)
            }

            this.hasResolved[o.label] = o // keep track of channels already resolved
            this.dispatchEvent(new CustomEvent('datachannel', {detail: o}))
        // }

    }

    // handleRemoveTrackEvent = (ev,id) => {
    //     if (ev.track){
    //         let track = ev.track
    //         this.dispatchEvent(new CustomEvent('trackremoved', {detail: {track, id}}))
    //         return true
    //     }
    // }


    handleICEConnectionStateChangeEvent = (_:Event, info:UserObject) => {
        const peer = this.peers.get(info.id) 
        switch(peer?.iceConnectionState) {
            case "closed":
            case "failed":
            this.closeConnection(info, peer);
              break;
          }
    }

    handleICEGatheringStateChangeEvent = (_:Event) => {}

    handleSignalingStateChangeEvent = (_:Event, info:UserObject) => {
        const peer = this.peers.get(info.id) 
        switch(peer?.signalingState) {
            case "closed":
            this.closeConnection(info, peer);
            break;
        }
    }

    closeConnection = (info:UserObject, peer?:RTCPeerConnection) => {
        if (peer) this.dispatchEvent(new CustomEvent('peerdisconnect', {detail: Object.assign(info, {peer})}))
    }

    createPeerConnection = async (peerInfo:UserObject, peerId?:string) => {

        const localConnection = new RTCPeerConnection(this.config);  

        // Add Local MediaStreamTracks to Peer Connection (on first offer)
        this.sources.forEach(s => {
            s.getTracks().forEach( async (track: MediaStreamTrack | any) => {
                if (track instanceof MediaStreamTrack) localConnection.addTrack(track, s) // ensure connection has track
            });
        })

        localConnection.onicecandidate = (e) => this.handleICECandidateEvent(e,peerInfo.id) // send candidates to remote
        localConnection.onnegotiationneeded = () => this.handleNegotiationNeededEvent(localConnection,peerInfo.id) // offer to remote
        localConnection.ondatachannel = (e) => this.handleDataChannelEvent(e,peerInfo.id)

        peerInfo.webrtc = localConnection

        if (!peerId) this.dispatchEvent(new CustomEvent('peerconnect', {detail: peerInfo}))
        else {
            // Only respond to tracks from remote peers
            localConnection.ontrack = (e) => {
                this.handleTrackEvent(e, peerId); 
            }
            // localConnection.onremovetrack = (e) => this.handleRemoveTrackEvent(e, peerId);
            localConnection.oniceconnectionstatechange = (e) => this.handleICEConnectionStateChangeEvent(e,peerInfo);
            localConnection.onicegatheringstatechange = (e) => this.handleICEGatheringStateChangeEvent(e);
            localConnection.onsignalingstatechange = (e) => this. handleSignalingStateChangeEvent(e,peerInfo);
            
        }

        return localConnection
    }

    remove = (id:string) => {
        let source = this.sources.get(id)
        this.sources.delete(id)
        source.removeEventListener('track', source)
    }

    getRooms = async (auth:string) => {
        let res = await this.notify({route: 'rooms', message: [auth]})
        return res.message
    }
    
    joinRoom = async (room:any, info:{[x:string]: any}, auth:string) => {
        return await this.notify({route: "connect", message:[auth, info, room]});
    }

    createRoom = async (room: any) => this.notify({route: 'createroom', message: [room]})

    leaveRoom = async (room: any) => {
        this.peers.forEach((_,key) => this.peers.delete(key))
        return this.notify({route: 'disconnect', message: [room]}) 
    }

    openDataChannel = async ({peer, channel, name, callback, reciprocated}:any) => {

        let local = false
        this.dataChannelQueueLength++ // increment name

        if (!(channel instanceof RTCDataChannel) && peer) {
            local = true
            let peerConnection = this.peers.get(peer)
            console.error('Opening data channel')
            if (peerConnection) channel = peerConnection.createDataChannel(name ?? 'my-data-channel');
        }

        return await this.useDataChannel(channel as RTCDataChannel, callback, local, reciprocated)
    }

    closeDataChannel = async (id:string) => {
        let dC = this.dataChannels.get(id)
        if (dC) dC.close()
        this.dataChannels.delete(id)
    }

    useDataChannel = (dataChannel:RTCDataChannel, onMessage:any=()=>{}, local:boolean=false, reciprocated:boolean=true):Promise<DataChannel> => {

        return new Promise((resolve) => {

            // Assign Event Listeners on Open
            dataChannel.addEventListener("open", () => {

                // Track DataChannel Instances
                const dC = new DataChannel(dataChannel)
                if (local) this.dataChannels.set(dC.id, dC) // only save local

                let toResolve = (channel:DataChannel) => {
                    
                    // Set OnMessage Callback
                    channel.parent.addEventListener("message", (event) => {
                        if (onMessage) onMessage(JSON.parse(event.data), channel); // parse messages from peer
                    })
                    
                    // Resolve to User
                    channel.sendMessage = (message) => {this.sendMessage(message, channel.id, reciprocated)} // TODO: Make this internal to the DataChannel?
                    
                    resolve(channel)
                }

                // If you know this won't be reciprocated, then resolve immediately
                if (!local || !reciprocated) toResolve(dC)
                
                // Otherwise mark to resolve OR resolve if this channel already has been
                else {
                    let existingResolve = this.hasResolved[dC.label]
                    if (existingResolve) {
                        toResolve(existingResolve)
                        delete this.hasResolved[dC.label]
                    } else this.toResolve[dC.label] = toResolve
                }
            });

            dataChannel.addEventListener("close", () =>{console.error('Data channel closed', dataChannel)});
        });
    };


    sendMessage = (message:object, id:string, reciprocated:boolean) => {
        let data = JSON.stringify(message)

        // Ensure Message Sends to Both Channel Instances
        let check = () => {
            let dC =  this.dataChannels.get(id)
            if (dC) {
                if (dC.parent.readyState === 'open') dC.send(data); // send on open instead
                else dC.parent.addEventListener('open', () => {dC.send(data);}) // send on open instead
            } else if (reciprocated) setTimeout(check, 500)
        }
        check()
    }


    // Clientside Subscription Service Methods
    // setRemote = (remote) => {
    //     this.remote = remote
    // }

    // addResponse = (name, f) => {
    //     this.responses.set(name, f)
    // }

    // send = async (o:MessageObject, options?: any):Promise<any> => {
    //     throw 'Send not implemented'
    // }

    // add = (user:Partial<UserObject>, endpoint:string):Promise<any> => {
    //     throw 'Add not implemented'
    // }
}