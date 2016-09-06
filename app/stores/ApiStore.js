import alt from '../alt';
import ApiActions from '../actions/ApiActions';

class ApiStore {
  constructor() {
    this.bindActions(ApiActions);
  }

  onCheckAccessTokenFromSessionSuccess(data){
      /*
      data  = {
            soundcloudAccess: true | false,
            soundcloudAccessToken: string
      }
      */

    return true;
  }

  onCheckAccessTokenFromSessionFail(jqXhr){
    console.log("[ApiStore.js] onCheckAccessTokenFromSessionFail: ");
    console.log(jqXhr.responseJSON.errorMessage);
    jqXhr.history.pushState(null, '/');
  }

  onSoundcloudOverviewGetSuccess(data){
    console.log(data)
  }

  onSoundcloudOverviewGetFail(jqXhr){
    console.log("[ApiStore.js] onSoundcloudOverviewGetFail: ");
    console.log(jqXhr.responseJSON.errorMessage);
    if(jqXhr.responseJSON.soundcloudAccess === false){
        jqXhr.history.pushState(null, '/');
    }
  }
}

export default alt.createStore(ApiStore);
