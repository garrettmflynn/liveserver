import { DataStreamTrack } from "datastreams-api"
import { randomId } from '@brainsatplay/router'

// Data Channels Behave Just Like Tracks
export default class DataChannel extends DataStreamTrack{

    id: string = ''
    label: string = ''
    parent: RTCDataChannel

    constructor(parent: RTCDataChannel){
        super()
        this.id = parent.id?.toString() ?? randomId()
        this.label = parent.label
        this.parent = parent 
    }


    send = (data:any):void => this.parent.send(data)
    sendMessage = (_:any):any => {}
}