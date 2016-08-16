import alt from '../alt';

class ApiActions {
  constructor() {
    this.generateActions(
      'checkAccessTokenFromSessionSuccess',
      'checkAccessTokenFromSessionFail',
      'soundcloudApiGetSuccess',
      'soundcloudApiGetFail'
    );
  }

  checkAccessToken(payload){
    $.ajax({
            type: 'POST',
            url: '/api/checkAccessTokenFromSession'
    })
    .done((data) => {
        this.actions.checkAccessTokenFromSessionSuccess(data);
    })
    .fail(jqXhr => {
        //redirect to homepage to login again
        jqXhr.history = payload.history;
        this.actions.checkAccessTokenFromSessionFail(jqXhr);
    })
  }

  soundcloudApiGet(payload){
      $.ajax({
                type: 'GET',
                url: 'api/soundcloudApiGet',
                data: {
                    apiUrl: payload.apiUrl
                }
      })
      .done((data) => {
          console.log("[ApiActions.js] soundcloudApiGet: Success");
          this.actions.soundcloudApiGetSuccess(data);
      })
      .fail(jqXhr => {
          console.log("[ApiActions.js] soundcloudApiGet: Fail");
          jqXhr.history = payload.history;
          this.actions.soundcloudApiGetFail(jqXhr);
      })
  }

}

export default alt.createActions(ApiActions);
