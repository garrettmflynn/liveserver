import React, { useEffect, useRef } from 'react';
import clsx from 'clsx';
import { UserPlatform } from '../../../../../src/frontend/index.js';

export default function BasicExample({server}) {
  
    const ping = useRef(null);
    const output = useRef(null);

    const platform = new UserPlatform({
      _id:'123456', //we are using randomly generated ones from realm/mongodb
      username:'johnnyboi',
      email:'johnnyboi@boyo.com',
      firstName:'johnny',
      lastName:'boyo',
      test: ['what']
  }, server);
  
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
  