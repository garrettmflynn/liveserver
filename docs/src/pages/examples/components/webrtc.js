import React, { useEffect, useRef } from 'react';
import clsx from 'clsx';
import styles from '../examples.module.css'

export default function WebRTCExample({server, endpointIds, router}) {
  
    const send = useRef(null);
    const connect = useRef(null);
    const disconnect = useRef(null);
    const output = useRef(null);
    const peerDiv = useRef(null);
    const meReadout = useRef(null);

    const peers = {}


    // To enable WebRTC, you must first subscribe using a different protocol
    router.subscribe((o) => {

      if (o.route === 'webrtc/rooms') console.log('New rooms!', o);  
      else if (o.route === 'webrtc/peers') console.log('New peer!', o);
      
    }, {
      protocol: 'websocket', // Use WebRTC to subscribe to peers only (not server)
      remote: endpointIds[1], // Server to manage peers
      routes: ['webrtc/rooms', 'webrtc/peers'] // Subscribe to updates
    })


  const channels = new Map()
  const webrtcClient = router.SERVICES.client.clients['webrtc']
  webrtcClient.onpeerconnect = async (ev) => {

    const id = ev.detail.id
    peers[id] = {
      element: document.createElement('div'),
      readout: document.createElement('span')
    }

    peers[id].element.insertAdjacentHTML('beforeend',`<strong>${id}: </strong>`)
    peers[id].element.insertAdjacentElement('beforeend', peers[id].readout)

    peerDiv.current.insertAdjacentElement('beforeend', peers[id].element)

    webrtcClient.openDataChannel({
      peer: id, // Peer ID
    }).then(o => {
          // connected.innerHTML = `${ev.detail.info.id}`
          o.subscribe((msg) => {
            console.log('oooooo')
            peers[o.peer].readout.innerHTML += msg
           })
          channels.set(o.id, o)
      })
  
  }

  webrtcClient.onpeerdisconnect = (ev) => {
    peers[ev.detail.id].element.remove()
    delete peers[ev.detail.id]
  }
  
  webrtcClient.ondatachannel = async (ev) => {
       ev.detail.subscribe((msg) => {
        console.log('other', peers, ev.detail)
          peers[ev.detail.peer].readout.innerHTML += msg
       })
  }
  
  // Send Key Presses
  globalThis.onkeydown = (ev) => {
      let msg = ev.key
      meReadout.current.innerHTML += msg
      channels.forEach(o => o.sendMessage(msg)) // type to the peer!
  }
    

    useEffect(() => {
      connect.current.onclick = () => {

        router.subscribe((o) => {
          console.log('New peer!', o);  
        }, {
          protocol: 'webrtc', // Use WebRTC to subscribe to peers only (not server)
          remote: endpointIds[1], // Server to manage peers
          routes: ['rooms/myroom', 'peers/test'] // Subscribe to peers OR create and subscribe rooms
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
          remote: endpointIds[1]
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
          <div><strong>Me: </strong><span ref={meReadout}></span></div>
          <div ref={peerDiv}></div>
          <div className={styles.terminal}><span ref={output}></span></div>

        </div>
      </header>
    );
  }
  