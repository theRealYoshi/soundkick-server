import alt from '../alt';
import GetAccessTokenActions from '../actions/GetAccessTokenActions';

class GetAccessTokenStore {
  constructor() {
    this.bindActions(GetAccessTokenActions);
  }

  onGetAccessTokenSuccess(data){
    console.log(data.soundcloudAccessToken);
    console.log('redirecting...');
    setTimeout(function(){
      data.history.pushState(null, '/api');
    }, 3000);
  }

  onGetAccessTokenFail(){
    console.log("grabbing access token failed...");
  }


}

export default alt.createStore(GetAccessTokenStore);
