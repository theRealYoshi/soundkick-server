import alt from '../alt';
import HomeActions from '../actions/HomeActions';

class HomeStore {
  constructor() {
    this.bindActions(HomeActions);
    this.redirectUrl = '';
  }

  onGetAccessTokenFromSessionSuccess(data){
    console.log('session token has been set to :' + data.soundcloudAccessToken);
    console.log('redirecting...');
    setTimeout(function(){
      data.history.pushState(null, '/api');
    }, 5000);
  }

  onGetAccessTokenFromSessionFail(jqXhr){
      console.log("[Homestore.js] onGetAccessTokenFromSessionFail:" );
      console.log(jqXhr.responseText);
  }

  onRedirectSuccess(data){
    console.log(data.redirectUrl);
    window.location.href = data.redirectUrl;
  }

}

export default alt.createStore(HomeStore);
