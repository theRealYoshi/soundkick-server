import alt from '../alt';

class HomeActions {
  constructor() {
    this.generateActions(
      'redirectSuccess',
      'redirectFail',
      'getAccessTokenFromSessionSuccess',
      'getAccessTokenFromSessionFail'
    );
  }

  getAccessTokenFromSession(payload){
    $.ajax({
          type: 'POST',
          url: '/api/getAccessTokenFromSession'
    })
    .done((data) => {
      data.history = payload.history;
      this.actions.getAccessTokenFromSessionSuccess(data);
    })
    .fail(jqXhr => {
      this.actions.getAccessTokenFromSessionFail();
    })
  }

  redirectAuth(payload){
    $.ajax({
          type: 'GET',
          url: '/api/redirectAuth'
     })
     .done((data) => {
       this.actions.redirectSuccess(data);
     })
     .fail(jqXhr => {
       this.actions.redirectFail(jqXhr.responseJSON.message);
     });
  }

}

export default alt.createActions(HomeActions);
