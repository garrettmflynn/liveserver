export type RouteConfig = {
    id?: boolean | string, // Basic identifier
    method?: 'GET' | 'POST', // Method constraints
    route: string, // Route Name
    aliases?: string[], // Name aliases
    protocols?: ProtocolObject // Networking constraints
    service?: string, // Service name
    callback: (...args:any[]) => any
}

export type SubscriptionCallbackType = (o:MessageObject, name?: MessageType) => any 

export type ProtocolObject = {
    websocket?: boolean,
    http?: boolean,
    osc?: boolean
}

export type AllMessageFormats = MessageObject | string | any[] 

export type MessageObject = {
    id?: string;
    _id?: string;
    route: string; // what to do at the endpoint
    callbackId?: string; // unique id for the request (stored client-side)
    message: [] | any // data passed
  }

export type ClientObject = {
    id: string,
    routes: Map<string, RouteConfig>
}

export type SettingsObject = {
    id?: string
    appname?: string
    type?: string
    object?: {}
    propnames?: string[]
    settings?: {
        keys?: any[]
    }
}

export type MessageType = undefined | boolean

export type UserObject = {
    id:string, 
    _id:string, //second reference (for mongodb parity)
    username:string,
    password?: string,
    origin:string,
    socket?: WebSocket, 
    props: {},
    updatedPropNames: string[],
    sessions:string[],
    blocked:string[], //blocked user ids for access controls
    lastUpdate:number,
    lastTransmit:number,
    latency:number,
    routes: Map<string, RouteConfig>
  }