import React from 'react';
import { Route, Switch, Link } from 'react-router-dom';
import Bsc from './Bsc';
import Arbitrum from './Arbitrum';
import Trading from './Trading';
import BscOrders from './BscOrders';
import './App.css';

const App = () => (
  <Switch>
    <div className="App">
      <nav>
         <Link to="/" className="nav-link">BSC</Link> 
         <Link to="/arbitrum" className="nav-link">Arbitrum</Link> 
      </nav>
      <div>
        <Route exact path="/" component={Bsc} />
        <Route exact path="/arbitrum" component={Arbitrum} />
        <Route exact path="/trading" component={Trading} />
        <Route exact path="/bsc-orders" component={BscOrders} />
      </div>
    </div>
  </Switch>
);

export default App;
