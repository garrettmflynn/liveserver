import React, { useEffect, useRef } from 'react';
import clsx from 'clsx';
import styles from '../examples.module.css'

export default function AllExample({server, endpoints, router}) {
  
    const buttons = useRef(null);
    const output = useRef(null);

    let buttonRef = buttons.current
    let outputRef = output.current

    let vals = {
      'add': 0
    }

    let divs = {}

    router.subscribe((o) => {
        console.log('Remote #1 Subscription', o)
        let data = o.message
        if (o.route === 'routes') handleRoutes(o.message[0])
        else {
        
        // Subscription Responses
        if (!data?.error) if (outputRef) outputRef.innerHTML = JSON.stringify(vals[o.route] = data)
        else if (outputRef) outputRef.innerHTML = data.error

      }
    }, {protocol: 'http', routes: ['routes', 'osc'], endpoint: endpoints[0]})

    function handleRoutes(data){

      divs = {}
      if (buttonRef) buttonRef.innerHTML = ''

      for (let route in data){
        const o = data[route]

        let test = o.route.split('/')
        let service = (test.length < 2) ? 'Base' : test[0]
        let name = (test.length < 2) ? test[0] : test[1]

        if (!divs[service]){
          divs[service] = document.createElement('div')
          divs[service].innerHTML = `<h2>${service}</h2>`
          divs[service].style.padding = '20px'
          if (buttonRef) buttonRef.insertAdjacentElement('beforeend', divs[service])
        }

        
        // o = {route: string, arguments: []}
        let button = document.createElement('button')
        button.className = 'button button--secondary button--lg'
        button.innerHTML = name
        button.onclick = ( ) => {
          let args = []
          if (o.route === 'unsafe/addfunc') args = ['add', (_, [a, b=1]) => a + b]
          else if (o.route === 'add') args = [vals['add']?.[0]]
          else if (o.route === 'ssr/add') args = ['/arbitrary/route', '<p>Just some arbitrary HTML</p>']

          // Sending Over HTTP Response
          send(o.route, 'post', ...args)
        }

        divs[service].insertAdjacentElement('beforeend', button)
      }
    }

    useEffect(async () => {
      console.log('ENDPOINT IDs', endpoints)

      buttonRef = buttons.current
      outputRef = output.current

    });

    send('routes', 'get')

    async function send(route, method, ...args){
      return await router[method]({
        route,
        endpoint: endpoints[0]
      }, ...args).then(res => {

        console.log('Direct response', res)

        if (!res?.error) {
          console.log(res)
          if (route === 'routes') handleRoutes(res[0])
          if (outputRef) outputRef.innerHTML = JSON.stringify(vals[route] = res)
        } else if (outputRef) outputRef.innerHTML = res.error

      }).catch(err => {
        if (outputRef) outputRef.innerHTML = err.error
      })

    }
  
    return (
      <header className={clsx('hero hero--primary')}>
        <div className="container">
          <h1 className="hero__title">All Routes</h1>
          <div className={styles.terminal}><span ref={output}></span></div>
          <div ref={buttons}>
          </div>
        </div>
      </header>
    );
  }
  