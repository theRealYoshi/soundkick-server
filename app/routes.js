import React from 'react';
import {Route} from 'react-router';
import App from './components/App';
import Api from './components/Api';
import Home from './components/Home';
import GetAccessToken from './components/GetAccessToken';
import Overview from './components/Overview';

export default (
  <Route component={App}>
    <Route path='/' component={Home} />
    <Route path='/getAccessToken' component={GetAccessToken} />
    <Route path='/api' component={Api} />
    <Route path='/overview' component={Overview} />
  </Route>
);
