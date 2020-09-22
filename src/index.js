import React from 'react'
import ReactDOM from 'react-dom'
import App from './components/App'
import { initContract } from './components/utils'

window.nearInitPromise = initContract()
    .then(() => {
        ReactDOM.render(
            <App />,
            document.querySelector('#root')
        )
    })
    .catch(console.error)
