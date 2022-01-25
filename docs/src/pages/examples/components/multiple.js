import React, { useEffect, useRef } from 'react';
import clsx from 'clsx';
import styles from '../examples.module.css'

export default function MultipleExample({server, router}) {
  
    const ping1 = useRef(null);
    const ping2 = useRef(null);
    const output = useRef(null);

    useEffect(() => {
      ping1.current.onclick = () => {
        router.get({
          route: 'users',
          remote: server
        }).then(res => {
          console.log(res)
          if (!res?.error) output.current.innerHTML = JSON.stringify(res)
          else output.current.innerHTML = res.error
  
        }).catch(err => {
          output.current.innerHTML = err.error
        })
      }

      ping2.current.onclick = () => {
        router.get({
          route: 'users',
          remote: 'http://localhost:81'
        }).then(res => {
          console.log(res)
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
            <button ref={ping1} className="button button--secondary button--lg">Ping 1</button>
            <button ref={ping2} className="button button--secondary button--lg">Ping 2</button>
          </div>
          <div className={styles.terminal}><span ref={output}></span></div>

        </div>
      </header>
    );
  }
  