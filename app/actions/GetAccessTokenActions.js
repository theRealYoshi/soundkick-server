import alt from '../alt';

class GetAccessTokenActions {
  constructor() {
    this.generateActions(
      'getAccessTokenSuccess',
      'getAccessTokenFail'
    );
  }

  getAccessToken(payload){
    $.ajax({
          type: 'POST',
          url: '/api/getAccessToken',
          data: {
                  authorizationCode: payload.authorizationCode
                }
     })
     .done((data) => {
       console.log("post success!");
       data.history = payload.history;
       this.actions.getAccessTokenSuccess(data);
     })
     .fail((jqXhr) => {
       this.actions.getAccessTokenFail(jqXhr);
     });
  }

}

export default alt.createActions(GetAccessTokenActions);
