import alt from '../alt';
import ApiActions from '../actions/ApiActions';

class ApiStore {
  constructor() {
    this.bindActions(ApiActions);
  }

  onCheckAccessTokenFromSessionSuccess(data){
    console.log(data);
  }

  onCheckAccessTokenFromSessionFail(data){
    console.log(data.soundcloudAccess);
    data.history.pushState(null, '/');
  }

  onCheckTracksSuccess(data){

  }

  onCheckTracksFail(data){

  }
}

export default alt.createStore(ApiStore);
