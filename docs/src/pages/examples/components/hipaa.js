import React, { useEffect, useRef } from 'react';
import clsx from 'clsx';
import styles from '../examples.module.css'
import { randomId } from '../../../../../src/common/id.utils';
import RouteDisplay from '../routeDisplay';
// import HIPAAClient from '../../../../../src/services/database/hipaa.router';
// import {settings} from '../../../../../src/server_settings.js'

// const hipaa = new HIPAAClient({}, {}, {
//   url: 'mongodb+srv://garrett-m-flynn:USC201720202021@cluster0.bdgxr.mongodb.net/liveserver?authSource=admin&replicaSet=atlas-nwmey6-shard-0&w=majority&readPreference=primary&appname=MongoDB%20Compass&retryWrites=true&ssl=true'
// })

// const SERVER_URI = settings.protocol+"://"+settings.hosturl+":"+settings.port//(window.location.href.includes('localhost')) ? 'http://localhost:80' : 'http://localhost:80' // Replace with production server URI
// const id = randomId()

// const endpoint = hipaa.connect({
//   target: SERVER_URI,
//   credentials: {id, _id: id}
// })

// console.log(hipaa, endpoint)
export default function HIPAAExample({server, endpoints, router, id}) {
  
    const send = useRef(null);
    const connect = useRef(null);
    const output = useRef(null);

  let endpoint;

    useEffect(() => {
      
      connect.current.onclick = () => {

      }

      send.current.onclick = () => {

      }
      
    });
  
    return (
      <header className={clsx('hero hero--primary')}>
        <div className="container">
        <h1>Coming soon...</h1>
          <div>
            <button ref={connect} className="button button--secondary button--lg">Connect</button>
            <button ref={send} className="button button--secondary button--lg">Ping</button>
          </div>
          <div className={styles.terminal}><span ref={output}></span></div>

        </div>
      </header>
    );
  }
  