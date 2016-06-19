import React from 'react';
import {Route} from 'react-router';
import App from './components/App';
import Home from './components/Home';
import GetAccessToken from './components/GetAccessToken';
import Api from './components/Api';

export default (
  <Route component={App}>
    <Route path='/' component={Home} />
    <Route path='/getAccessToken' component={GetAccessToken} />
    <Route path='/api' component={Api} />
  </Route>
);
