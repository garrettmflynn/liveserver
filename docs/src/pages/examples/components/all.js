import React, { useEffect, useRef } from 'react';
import clsx from 'clsx';
import {http} from '../../../../../src/frontend';

export default function AllExample({server, platform}) {
  
    const buttons = useRef(null);
    const output = useRef(null);

    let vals = {
      '/add': 0
    }

    let customRoute = {
      route: '/add',
      callback: (a, b=1) => a + b
    }

    useEffect(async () => {

      // http.addRoute(customRoute)
      buttons.current.innerHTML = ''
      platform.send('list').then((data) => {

        if (!Array.isArray(data)) data = [data]
        data.forEach(o => {

          // o = {route: string, arguments: []}
          let button = document.createElement('button')
          button.className = 'button button--secondary button--lg'
          button.innerHTML = o.route
          buttons.current.insertAdjacentElement('beforeend', button)
          button.onclick = ( ) => {
            let args = []
            if (o.route === '/list') buttons.current.innerHTML = ''
            if (o.route === '/unsafe/addfunc') args = [customRoute]
            else if (vals[o.route] != null) args = [vals[o.route]]

            platform.send(o.route, ...args).then(res => {
              if (!res?.error) output.current.innerHTML = JSON.stringify(vals[o.route] = res)
              else output.current.innerHTML = res.error
      
            }).catch(err => {
              output.current.innerHTML = err.error
            })
          }
        })

      })
    });
  
    return (
      <header className={clsx('hero hero--primary')}>
        <div className="container">
          <h1 className="hero__title">All Routes</h1>
          <p className="subtitle"><strong>Output:</strong> <span ref={output}></span></p>
          <div ref={buttons}>
          </div>
        </div>
      </header>
    );
  }
  