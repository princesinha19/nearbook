import React from 'react';
import './App.css';
import 'regenerator-runtime/runtime';
import 'bootstrap/dist/css/bootstrap.css';
import {
    Switch,
    HashRouter,
    Route,
    Redirect,
} from "react-router-dom";
import Orderbook from './Orderbook';
import history from './Utils/History';
import Rainbow from './Rainbow';

function App() {
    const routes = (
        <Switch>
            <Route path="/" exact>
                <Orderbook />
            </Route>
            <Route path="/rainbow-bridge" exact>
                <Rainbow />
            </Route>
            <Redirect to="/" />
        </Switch>
    );

    return (
        <div className="App">
            <HashRouter history={history}>
                {routes}
            </HashRouter>
        </div>
    );
}

export default App;
