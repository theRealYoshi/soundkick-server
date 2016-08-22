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

  onGetAccessTokenFail(jqXhr){
    console.log("grabbing access token failed...");
    console.log(jqXhr);
  }


}

export default alt.createStore(GetAccessTokenStore);
