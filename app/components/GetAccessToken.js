import React from 'react';
import {Link} from 'react-router';
import GetAccessTokenStore from '../stores/GetAccessTokenStore'
import GetAccessTokenActions from '../actions/GetAccessTokenActions';

class GetAccessToken extends React.Component {

  constructor(props) {
    super(props);
    this.state = GetAccessTokenStore.getState();
    this.onChange = this.onChange.bind(this);
  }

  componentDidMount() {
    GetAccessTokenStore.listen(this.onChange);
    GetAccessTokenActions.getAccessToken({
      authorizationCode: this.props.location.query.code,
      history: this.props.history
    });
  }

  componentWillUnmount() {
    GetAccessTokenStore.unlisten(this.onChange);
  }

  onChange(state) {
    this.setState(state);
  }

  render() {
    return (
      <div className='container'>
        <div className='row'>
          <div className='redirectAuth'>
            Thanks for dropping by!
          </div>
        </div>
      </div>
    );
  }
}

export default GetAccessToken;
