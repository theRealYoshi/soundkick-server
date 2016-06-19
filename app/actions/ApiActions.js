import alt from '../alt';

class ApiActions {
  constructor() {
    this.generateActions(
      'checkAccessTokenFromSessionSuccess',
      'checkAccessTokenFromSessionFail',
      'checkTracksSuccess',
      'checkTracksFail'
    );
  }

  checkAccessToken(payload){
    $.ajax({
            type: 'POST',
            url: '/api/checkAccessTokenFromSession'
    })
    .done((data) => {
      console.log('check access success');
      console.log(data.soundcloudAccess);
      console.log(data.soundcloudAccessToken);
      this.actions.checkAccessTokenFromSessionSuccess(data);
    })
    .fail((data) => {
      console.log('check access fail');
      data.history = payload.history;
      this.actions.checkAccessTokenFromSessionFail(data);
    })
  }

  checkTracks(){
    $.ajax({
            type: 'GET',
            url: '/api/checkTracks'
    })
    .done((data) => {
      console.log(data);
    })
    .fail((data) => {
      console.log(data);
    })
  }

}

export default alt.createActions(ApiActions);
