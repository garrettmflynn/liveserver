import { Router } from '../router/Router'
import { Endpoint } from 'src/router/Endpoint'
export type RouterInterface = Partial<Router>

export type RouteConfig = {
    route: string, // Route Name
    id?: string, // Basic identifier for Clients
    private?: boolean, // Hide Route from Router 'routes' function (TODO: can still be called from knowledgeable clients...)
    // method?: 'GET' | 'POST', // Method constraints
    reference?: any | {
        object: any,
        transform: (o) => any
    }, // Reference to an object that notifies subscribers on change
    aliases?: string[], // Name aliases
    protocols?: ProtocolObject // Networking constraints
    headers?: any // Specify headers
    service?: string, // Service name

    args?: string[] // Derived argument names
    callback?: (self: Router, args: any[], id: string) => any
}

export type EndpointConfig = string | URL | {
    type: 'server' | 'webrtc'
    target?: string|URL,
    link?: Endpoint
  }

export type RouteSpec = string | {
    route: string,
    endpoint?: Endpoint // === id
    // id?: string // id
}

export type SubscriptionCallbackType = (o:MessageObject, name?: MessageType, origin?:string|number|undefined) => any 

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
    method?: FetchMethods, // Method constraints
    callbackId?: string; // unique id for the request (stored client-side)
    message: [] | any // data passed,
    suppress?: boolean,
    headers?: {[x: string] : string}
    block?: boolean
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

export type MessageType = 'local' | 'remote' | 'subscribers'

export type FetchMethods = 'GET' | 'POST' | 'DELETE'

export type UserObject = {
    id:string, 
    _id:string, //second reference (for mongodb parity)
    username:string,
    password?: string,
    origin:string,
    send?: Function, // Send a message back to the client
    webrtc?: RTCPeerConnection // Client-side
    props: {},
    updatedPropNames: string[],
    sessions:string[],
    blocked:string[], //blocked user ids for access controls
    lastUpdate:number,
    lastTransmit:number,
    latency:number,
    routes: Map<string, RouteConfig>

    // To Determine if Useful
    userRoles?: any[]
    email?: string,
  }