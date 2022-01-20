import React from 'react';
import clsx from 'clsx';
import styles from './examples.module.css';
import BasicExample from './components/basic';
import { useHistory } from 'react-router';
import AllExample from './components/all';

export default function ExampleSelector({server}) {
   const history = useHistory();
    var url = window.location;
    var name = new URLSearchParams(url.search).get('name');
    const [example, setExample] = React.useState(name ?? 'http');


    const renderExample = (name) => {
        switch(name) {
          case 'basic':
            return <BasicExample
            server={server}
            />
          case 'http':
            return <AllExample
            server={server}
          />
        }
      }

    const set = (name) => {
      history.replace(`/examples?name=${name}`)
      setExample(name)
    }
  
    return (
        <>
      <nav className={clsx(styles.nav)}>
        <button onClick={() => set('basic')}>
          Basic
        </button>
        <button onClick={() => set('http')}>
          All HTTP Routes
        </button>
        </nav>

        <header>
            {renderExample(example)}
        </header>
        </>
    );
  }
  