//A host on a WebRTC channel can relay session streams, regulate file streams, etc.

import { WebRTCClient } from ".";
import { Router } from 'liveserver-router';
import { SessionsBackend, SessionsClient } from "../sessions";
import { DatabaseBackend, UsersClient } from "../database";
import { UnsafeBackend } from "../unsafe";

//creates a WebRTC controller for running sessions and p2p databases, i.e. backend data streaming services but hosted on WebRTC
export class WebRTCController {
    
    webrtc:WebRTCClient;

    router:Router;
    
    SessionsBackend:SessionsBackend;
    SessionsClient:SessionsClient;

    UsersClient:UsersClient;
    DatabaseBackend:DatabaseBackend;

    constructor(
        webrtc:WebRTCClient, 
        userinfo={_id:'user'+Math.floor(Math.random()*10000000000)}, 
        options={sessions:true,db:true,safe:false}
    ) {

        if(!webrtc) return undefined;
        this.webrtc = webrtc; 

        this.router = new Router({debug:true});
        //we need to update the notify function to go through the WebRTC client instead of http or websockets
        
        if(options.sessions) {
            this.SessionsBackend = new SessionsBackend(this.router,true); //Backend functions
            this.router.load(this.SessionsBackend);
            this.SessionsClient = new SessionsClient(userinfo); //Frontend functions. How does the DataStreaming notify function get hooked up? How does the SessionsClient notify function hook up?
            this.router.load(this.SessionsClient);
        }
        if(options.db) {
            this.DatabaseBackend = new DatabaseBackend(this.router,{mode:'local'}); //Backend functions
            this.router.load(this.DatabaseBackend);
            this.UsersClient = new UsersClient(userinfo); //Frontend functions, how does this hook up to the router's notify?
            this.router.load(UsersClient);
        }
        if(!options.safe) this.router.load(new UnsafeBackend()); //enables remote code execution! beware the bitcoins!
        
    }

    //copy data from another host into the local services and toggle necessary flags to be the lead sender/receiver of data
    becomeHost() {
        //copy data from other host (which could be the main server offloading a portion of data to the webrtc host)

        //set flags so that other peers in the room will stream their data to you instead of the previous host
    }

    //migrate to another user by passing all of the hosted data over to your service instances
    //OR if need be, migrate back to the dedicated server by updating the data the normal way (decentralize <---> recentralize on the fly?)
    migrateHost() {

    }

    

}