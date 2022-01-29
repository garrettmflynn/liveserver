import {Room} from './Room'
import { RoomInterface } from './types/Room.types'
import { MessageObject, UserObject } from '../../common/general.types'
import { Service } from '../../router/Service'

export class WebRTCBackend extends Service {

    name = 'webrtc'
    subscribers: Map<string,UserObject> = new Map()
    rooms: Map<string,any> = new Map()

    routes = [

        {
            route: 'subscribe',
            callback: (self, args, id) => {
                let u = self.USERS[id]
                console.log(u, id, self.USERS)
                if (u) this.subscribers.set(id, u)

                // Subscribe or Create Room
                const rooms = this.getRooms()
                const users = Array.from(this.subscribers).map(a => a[1])
                args[0]?.forEach(route => {
                    const slice = route.slice(0,6)
                    route = route.slice(6)

                    if (u?.send) u.send({route: 'webrtc/rooms', message: rooms})
                    if (u?.send) u.send({route: 'webrtc/users', message: users})
                    if (slice === 'rooms'){
                        console.log(slice, route)
                        const room = this.rooms.get(route)
                        if (room) {
                            if (u?.send) u.send({route: 'webrtc/room', message: room}) // Send back to user in whatever way you can
                            this.connect(room, id)
                        } else console.log('Room not found.')
                    } else {
                        console.log(slice, route)
                        const user = this.subscribers.get(route)
                        if (user) {
                            if (u?.send) u.send({route: 'webrtc/user', message: user}) // Send back to user in whatever way you can
                            this.connect(user, id)
                        } else console.log('User not found.')
                    }
                })
                return {route:'rooms', message: {
                    users,
                    rooms
                }} // TODO: Limit viewable rooms and users
            }
        },
        {
            route: 'unsubscribe',
            callback: (self, args, id) => {
                this.subscribers.delete(id)
                this.rooms.forEach(r => r.peers.has(id) && r.removePeer(id));
                return;
            }
        },

        // WebRTC Basic Commands
        {
            route: 'offer',
            callback: (self, args, id) => {
                return this.pass('offer', id, args[0], args[1])
            }
        },
        {
            route: 'answer',
            callback: (self, args, id) => {
                return this.pass('answer', id, args[0], args[1])
            }
        },
        {
            route: 'candidate',
            callback: (self, args, id) => {
                return this.pass('candidate', id, args[0], args[1])
            }
        },

        // Room Management
        {
            route: 'rooms',
            callback: (self, args, id) => {
                let res = this.getRoomsByAuth(args[0])
                return {message: res, route: 'rooms'}
            }
        },

        {
            route: 'newroom',
            callback: async (self, args, id) => {
                const message = await this.createRoom(args[0], id)
                console.log('message', message)
                return {route: 'newroom', message}
            }
        },

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
        return Array.from(this.rooms, ([, value]) => value.export()).filter(filter)
    }

    connect = (roomInfo:any, origin: string) => {

        // Get Room
        let room = (roomInfo) ? this.rooms.get(roomInfo?.uuid) : this.rooms.values().next().value // Default to first room
        console.log('connecting room', room, this.rooms)

        // Reset Auth and Info on Peer
        let u = this.subscribers.get(origin)

        console.log('connecting subscriber', u, this.subscribers)
        if (u){

            // TODO: Fix
            // if (o.message.info) u.info = Object.assign(u.info, o.message.info)
            // if (o.message.auth) u.auth = o.message.auth

            // Try to Add Peer to the Room
            if (room) room.addPeer(u)
        }

        return room.export()
    }

    createRoom = async (settings:RoomInterface,origin='server') => {

        // Get Room Initiator
        let initiator = this.subscribers.get(origin)

        let room = new Room(initiator, settings)

        this.rooms.set(room.uuid, room)

        let data = room.export()

        // Setup a Room

        // Tell Everyone about the New Room
        this.subscribers.forEach((u) => {
            this.notify({route: 'roomadded', message: data})
        })

        return data
    }

    disconnect = (roomId: string, origin: string) => {

        if (roomId) this.removePeerFromRoom(this.rooms.get(roomId), origin) // Remove from specified room
        else this.rooms.forEach(r => r.peers.has(origin) && this.removePeerFromRoom(r,origin)) // Remove from all rooms

        return {cmd: 'roomclosed'}
    }

    removePeerFromRoom = (room: Room, origin: string) => {
        room.removePeer(origin) // remove peer from room

        if (room.empty === true){
            setTimeout(() => {

                // Remove if still empty
                if (room.empty) this.rooms.delete(room.uuid)

            }, 5 * 60 * 1000) // check again after 5 minutes
        }
    }

    // Macro for Passing Offers, Answers, and Candidates between Peers
    pass = (cmd:string, origin: string, destination:string, msg:any) => {
        let recipient = this.subscribers.get(destination)
        if (recipient?.send) recipient.send(JSON.stringify({cmd, data: {id: origin, msg}, id: origin, service: 'webrtc'}))
    }
}

export default WebRTCBackend;