import React, { useEffect, useRef } from 'react';
import clsx from 'clsx';
import styles from '../examples.module.css'

export default function WebRTCExample({server, endpoints, router}) {
  
    const send = useRef(null);
    const connect = useRef(null);
    const disconnect = useRef(null);
    const output = useRef(null);
    const peerDiv = useRef(null);
    const meReadout = useRef(null);

    const peers = {}


  const channels = new Map()
  const webrtcClient = router.SERVICES['webrtc']
  webrtcClient.onpeerconnect = async (ev) => {

    const id = ev.detail.id
    peers[id] = {
      element: document.createElement('div'),
      readout: document.createElement('span')
    }

    peers[id].element.insertAdjacentHTML('beforeend',`<strong>${id}: </strong>`)
    peers[id].element.insertAdjacentElement('beforeend', peers[id].readout)

    peerDiv.current.insertAdjacentElement('beforeend', peers[id].element)

    console.log('Opening Data Channel')
    webrtcClient.openDataChannel({
      peer: id, // Peer ID
    }).then(o => {

          console.log('Data Channel Opened', o)

          channels.set(o.peer, o) // Sending End
          o.subscribe((dict) => {
              peers[o.peer].readout.innerHTML += dict.message
          })

      })
  }

  webrtcClient.onpeerdisconnect = (ev) => {

    console.log('Disconnect from peer')
    peers[ev.detail.id].element.remove()
    channels.delete(ev.detail.id)
    delete peers[ev.detail.id]
  }
  
  // Redundant: Can catch with openDataChannel
  webrtcClient.ondatachannel = async (ev) => {}
    

  let peerReference;

    useEffect(() => {
      connect.current.onclick = () => {

        // Can be Room or Peer
        peerReference = router.connect({
          type: 'webrtc',
          target: 'rooms/myroom', // e.g. 'rooms/myroom', 'peers/test'
          link: endpoints[1]
        })
        
        peerReference.subscribe((res) => {
          console.log('Peer message...', res); 

          if (!res?.error) output.current.innerHTML = JSON.stringify(res)
          else output.current.innerHTML = res.error 

        }).then(res => {
          if (!res?.error) output.current.innerHTML = 'Connected!'
          else output.current.innerHTML = res.error

          return res
        }).catch(err => {
          output.current.innerHTML = err.error
        })
      }

      send.current.onclick = () => {


        let route = 'ping'
        meReadout.current.innerHTML += route
        console.log(peerReference)
        // peerReference.send({})
        // channels.forEach(o => o.send({route:'webrtc/stream', message})) // type to the peer!

        channels.forEach(o => o.send({route}))

        // peerReference.send('ping').then(res => {
        //   console.log(res)
        // })
      }

      disconnect.current.onclick = () => {
        peerReference.send({
          route: 'webrtc/disconnect',
          // endpoint: endpoints[1]
        })
      }

    });
  
    return (
      <header className={clsx('hero hero--primary')}>
        <div className="container">
          <div>
            <button ref={connect} className="button button--secondary button--lg">Connect</button>
            <button ref={send} className="button button--secondary button--lg">Ping</button>
            <button ref={disconnect} className="button button--secondary button--lg">Disconnect</button>
          </div>
          <div><strong>Me: </strong><span ref={meReadout}></span></div>
          <div ref={peerDiv}></div>
          <div className={styles.terminal}><span ref={output}></span></div>

        </div>
      </header>
    );
  }
  