import {Room} from './Room'
import { RoomInterface } from './types/Room.types'
import { MessageObject, UserObject } from '../../common/general.types'
import { Service } from '../../router/Service'

export class WebRTCBackend extends Service {

    name = 'webrtc'
    peers: {[x:string]:UserObject} = {}
    rooms: {[x:string]:any} = {}

    routes = [

        {
            route: 'subscribe',
            callback: (self, args, id) => {
                let u = self.USERS[id]
                if (u && !this.peers[id]) {
                    this.peers[id] = u
                }

                // Subscribe or Create Room
                const rooms = this.getRooms()
                args[0]?.forEach(route => {
                    const split = route.split('/')
                    route = split[1]

                    // Slice out Room and Peer subscriptions
                    if (split[0] === 'rooms'){

                        // First Check Room ID. Then fallback to name.
                        let room = this.rooms[route] || Object.values(this.rooms).find(r => r.name === route)
                        if (room) {
                            this.connect(room, id)
                        } else {
                            room = this.createRoom({name: route})
                            this.connect(room,id)
                        }
                    } else {
                        if (split[0] !== 'users') route = split[0] // base user
                        const user = this.peers[route]
                        if (user) {
                            this.connect(user, id)
                        } else console.log('User not found.')
                    }
                })
                return {route:'info', message: [this.getPeers(), rooms]} // TODO: Limit viewable rooms and users
            }
        },
        {
            route: 'unsubscribe',
            callback: (self, args, id) => {
                delete this.peers.delete[id]
                for (let room in this.rooms){
                    const r = this.rooms[room]
                    if (r.peers[id]){
                        r.removePeer(id)
                    }
                }
                return;
            }
        },
        {
            route: 'removeUser',
            callback: (self, args, id) => {
                console.log('REMOVING USER IN WEBRTC', args)
                return;
            }
        },
        {
            route: 'peers',
            reference: {
                object: this.peers,
                transform: () => this.getPeers()
            },
            // callback: (self, args, id) => {
            //     return;
            // }
        },
        {
            route: 'rooms',
            reference: {
                object: this.rooms,
                transform: () => this.getRooms()
            },
            // callback: (self, args, id) => {
            //     return;
            // }
        },

        // WebRTC Basic Commands
        {
            route: 'offer',
            callback: (self, args, id) => {
                return this.pass('webrtc/offer', id, args[0], JSON.parse(args[1]))
            }
        },
        {
            route: 'answer',
            callback: (self, args, id) => {
                return this.pass('webrtc/answer', id, args[0], JSON.parse(args[1]))
            }
        },
        {
            route: 'candidate',
            callback: (self, args, id) => {
                return this.pass('webrtc/candidate', id, args[0], JSON.parse(args[1]))
            }
        },

        // // Room Management
        // {
        //     route: 'rooms',
        //     callback: (self, args, id) => {
        //         let res = this.getRoomsByAuth(args[0])
        //         return {message: [res], route: 'rooms'}
        //     }
        // },

        // {
        //     route: 'newroom',
        //     callback: async (self, args, id) => {
        //         const message = await this.createRoom(args[0], id)
        //         console.log('message', message)
        //         return {route: 'newroom', message}
        //     }
        // },

        {
            route: 'connect',
            callback: (self, args, id) => {
                return this.connect(args[0], id)
            }
        },

        {
            route: 'disconnect',
            callback: (self, args, id) => {
                return this.disconnect(args[0], id)

            }
        },
    ]

    constructor() {
        super()
    }

    getRoomsByAuth = (auth:string) => this.getRooms((r) => r.restrictions?.users == null || r.restrictions.users.includes(auth))

    getRooms = (filter:(arg:Room) => boolean = () => true) => {
        return Object.values(this.rooms).filter(filter).map(value => value.export())
    }

    getPeers = (filter:(arg:UserObject) => boolean = () => true) => {
        return Object.values(this.peers).filter(filter).map(v => {return {id:v.id, username:v.username}})
    }

    // Connect with RoomInfo or UserInfo
    connect = (info:RoomInterface|UserObject, origin: string) => {

        let u = this.peers[origin]
        let room = this.rooms[info?.id]
        let peer = this.peers[info?.id]

        // Connect Peer
        if (peer) {
            u.send({route: "webrtc/connect", message: [{id:peer.id, info: peer}]}) // initialize connections
            peer.send({route: "webrtc/connect", message: [{id: u.id, info: u}]}) // extend connections
            return peer
        } 
        
        // Default to Room
        else {
            if (!room) room = Object.values(this.rooms)[0] // Default to first room
            if (room) room.addPeer(u) // Adding peer to room
            return room.export()
        }
    }

    createRoom = async (settings:RoomInterface,origin='server') => {

        // Get Room Initiator
        let initiator = this.peers[origin]

        let room = new Room(initiator, settings)

        this.rooms[room.id] = room 

        let data = room.export()

        return data
    }

    disconnect = (roomId: string, origin: string) => {

        if (roomId) this.removePeerFromRoom(this.rooms[roomId], origin) // Remove from specified room
        else {
            for (let room in this.rooms){
                const r = this.rooms[room]
                this.removePeerFromRoom(r,origin)

            }
        }
        return {cmd: 'roomclosed'}
    }

    removePeerFromRoom = (room: Room, origin: string) => {
        room.removePeer(origin) // remove peer from room

        if (room.empty === true){
            setTimeout(() => {

                // Remove if still empty
                if (room.empty) delete this.rooms[room.id]

            }, 5 * 60 * 1000) // check again after 5 minutes
        }
    }

    // Macro for Passing Offers, Answers, and Candidates between Peers
    pass = (route:string, origin: string, destination:string, msg:any) => {
        let recipient = this.peers[destination]
        if (recipient?.send) recipient.send({route, message: [origin, msg], id: origin})
    }
}

export default WebRTCBackend;