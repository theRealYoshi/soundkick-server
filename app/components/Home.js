import React from 'react';
import {Link} from 'react-router';
import HomeStore from '../stores/HomeStore'
import HomeActions from '../actions/HomeActions';

class Home extends React.Component {

  constructor(props) {
    super(props);
    this.state = HomeStore.getState();
    this.onChange = this.onChange.bind(this);
  }

  componentDidMount() {
    HomeStore.listen(this.onChange);
    HomeActions.getAccessTokenFromSession({
      history: this.props.history
    });
  }

  componentWillUnmount() {
    HomeStore.unlisten(this.onChange);
  }

  onChange(state) {
    this.setState(state);
  }

  _handleRedirect(event) {
    event.preventDefault();
    HomeActions.redirectAuth({
      history: this.props.history
    });
  }

  render() {

    return (
      <div className='container'>
        <div className='row'>
          <div className='redirectAuth' onClick={this._handleRedirect.bind(this)}>
            click me
          </div>
        </div>
      </div>
    );
  }
}

export default Home;
