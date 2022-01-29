import React, { useEffect, useRef } from 'react';
import clsx from 'clsx';
import styles from '../examples.module.css'

export default function WebRTCExample({server, endpointIds, router}) {
  
    const send = useRef(null);
    const connect = useRef(null);
    const disconnect = useRef(null);
    const output = useRef(null);

    

    useEffect(() => {
      connect.current.onclick = () => {

        // MAKE SURE TO SUBSCRIBE IN SOME OTHER WAY FIRST...
        router.subscribe((o) => {
          console.log('New peer!', o)  
        }, {
          
          protocol: 'webrtc',
          id: endpointIds[1], // Server to manage peers
          routes: ['rooms', 'users']

        }).then(res => {
          if (!res?.error) output.current.innerHTML = JSON.stringify(res)
          else output.current.innerHTML = res.error
  
        }).catch(err => {
          output.current.innerHTML = err.error
        })
      }

      send.current.onclick = () => {
        router.send({
          route: 'webrtc/send',
          id: endpointIds[1]
        }).then(res => {
          if (!res?.error) output.current.innerHTML = JSON.stringify(res)
          else output.current.innerHTML = res.error
  
        }).catch(err => {
          output.current.innerHTML = err.error
        })
      }

      disconnect.current.onclick = () => {
        router.send({
          route: 'webrtc/disconnect',
          id: endpointIds[1]
        }).then(res => {
          if (!res?.error) output.current.innerHTML = JSON.stringify(res)
          else output.current.innerHTML = res.error
  
        }).catch(err => {
          output.current.innerHTML = err.error
        })
      }

    });
  
    return (
      <header className={clsx('hero hero--primary')}>
        <div className="container">
          <div>
            <button ref={connect} className="button button--secondary button--lg">Connect</button>
            <button ref={send} className="button button--secondary button--lg">Send</button>
            <button ref={disconnect} className="button button--secondary button--lg">Disconnect</button>
          </div>
          <div className={styles.terminal}><span ref={output}></span></div>

        </div>
      </header>
    );
  }
  