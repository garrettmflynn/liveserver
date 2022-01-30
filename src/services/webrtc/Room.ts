
import { RoomInterface } from './types/Room.types'
import { randomId } from '../../common/id.utils'
import { UserObject } from '../../common/general.types'

export class Room {

    // Core Properties
    id: string = randomId()
    name: string = ''
    initiator: UserObject
    restrictions: any = {}
    peers: Map<string,UserObject> = new Map()
    empty:boolean = false

    constructor(initiator: UserObject, settings:RoomInterface = {name: null, restrictions: {}}){

        // Core Properties
        this.name = settings.name ?? this.id
        this.initiator = initiator
        this.restrictions = settings.restrictions

    }

    export = () => {
        return {
            id: this.id,
            name: this.name,
            initiator: this.initiator?.id,
            restrictions: this.restrictions,
            peers: Array.from(this.peers, ([,peer]) => peer.id)
        } as RoomInterface
    }

    addPeer = (o: UserObject) => {

        // Check User Existence
        if (this.peers.has(o.id)) console.error('User already added to room.')

        // Check User Authorization (if required) | Currently just a specified id
        // TODO: Fix
        // else if (this.restrictions?.users && !this.restrictions.users.includes(o.auth)) console.error('User not authorized to join room.')
        
        // Otherwise Let Join
        else {
            
            if (!this.restrictions?.max || this.restrictions.max > this.peers.size) {

            // Request Peer Connections
            this.peers.forEach((peer) => {
                console.log('Notifying')
                o.send({route: "webrtc/connect", message: [{id:peer.id, info: peer}]}) // initialize connections
                peer.send({route: "webrtc/connect", message: [{id:o.id, info: o}]}) // extend connections
            })

            // Set in Room
            this.peers.set(o.id, o)

        } else console.error('Room is full')
    }
        
    }

    removePeer = (origin: string) => {
        let peer = this.peers.get(origin)
        this.peers.delete(origin)
        // TODO: Fix
        this.peers.forEach(p => p.send({route: "disconnectPeer", message: [{id: peer.id, info: peer}], id: origin})) // remove from peers
        if (this.peers.size === 0) this.empty = true
    }
}
