import {Room} from './Room'
import { RoomInterface } from './types/Room.types'
import { MessageObject, UserObject } from '@brainsatplay/liveserver-common/general.types'
import { Service } from '@brainsatplay/liveserver-common';

export class WebRTCService extends Service {

    name = 'webrtc'
    users: Map<string,UserObject> = new Map()
    rooms: Map<string,any> = new Map()

    routes = [
        {
            private: true,
            route: 'addUser',
            callback: (self, args, id) => {
                let u = self.USERS.get(id)
                this.users.set(u.id, u)
                let message = this.getRoomsByAuth(args[0])
                return {route:'rooms', message}
            }
        },
        {
            private: true,
            route: 'removeUser',
            callback: (self, args, id) => {
                this.users.delete(id)
                this.rooms.forEach(r => r.peers.has(id) && r.removePeer(id))
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

    getRooms = (filter:(arg:Room) => boolean) => {
        return Array.from(this.rooms, ([, value]) => value.export()).filter(filter)
    }

    connect = (roomInfo:any, origin: string) => {

        // Get Room
        let room = (roomInfo) ? this.rooms.get(roomInfo?.uuid) : this.rooms.values().next().value // Default to first room
        console.log('connecting room', room, this.rooms)

        // Reset Auth and Info on Peer
        let u = this.users.get(origin)

        console.log('connecting user', u, this.users)
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
        let initiator = this.users.get(origin)

        let room = new Room(initiator, settings)

        this.rooms.set(room.uuid, room)

        let data = room.export()

        // Setup a Room

        // Tell Everyone about the New Room
        this.users.forEach((u) => {
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
        let recipient = this.users.get(destination)
        if (recipient?.send) recipient.send(JSON.stringify({cmd, data: {id: origin, msg}, id: origin, service: 'webrtc'}))
    }
}