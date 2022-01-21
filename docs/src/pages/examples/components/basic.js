import React, { useEffect, useRef } from 'react';
import clsx from 'clsx';

export default function BasicExample({server, platform}) {
  
    const ping = useRef(null);
    const output = useRef(null);
  
    useEffect(() => {
      ping.current.onclick = () => {

        // platform.sendMessage('123456','test');
        platform.ping().then(res => {
          if (!res?.error) output.current.innerHTML = res
          else output.current.innerHTML = res.error
  
        }).catch(err => {
          output.current.innerHTML = err.error
        })
      }
    });
  
    return (
      <header className={clsx('hero hero--primary')}>
        <div className="container">
          <h1 className="hero__title">Example</h1>
          <p className="subtitle"><strong>Websocket:</strong> <span ref={output}></span></p>
          <div>
            <button ref={ping} className="button button--secondary button--lg">Ping</button>
          </div>
        </div>
      </header>
    );
  }
  