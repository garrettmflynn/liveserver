import { DataStreamTrack } from "datastreams-api"
import { randomId } from '../../common/id.utils'

// Data Channels Behave Just Like Tracks
export default class DataChannel extends DataStreamTrack {

    id: string = ''
    label: string = ''
    parent: RTCDataChannel
    peer?: string

    constructor(parent: RTCDataChannel, peer?:string){
        super()
        this.id = parent.id?.toString() ?? randomId()
        this.label = parent.label
        this.parent = parent 
        this.peer = peer 

    }


    send = (data:any):void => this.parent.send(data)
    sendMessage = (_:any):any => {
        console.log('trying tosend')
    }
}