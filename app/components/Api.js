import React from 'react';
import {Link} from 'react-router';
import ApiStore from '../stores/ApiStore'
import ApiActions from '../actions/ApiActions';

class Api extends React.Component {

  constructor(props) {
    super(props);
    this.state = ApiStore.getState();
    this.onChange = this.onChange.bind(this);
  }

  componentDidMount() {
    ApiStore.listen(this.onChange);
    ApiActions.checkAccessToken({
      history: this.props.history
    });
  }

  componentWillUnmount() {
    ApiStore.unlisten(this.onChange);
  }

  onChange(state) {
    this.setState(state);
  }

  _handleTracks(){
    ApiActions.checkTracks();
  }

  render() {

    return (
      <div className='container'>
        <div className='row'>
          At Api Page
          <div className='redirectAuth' onClick={this._handleTracks.bind(this)}>
            click me
          </div>
        </div>
      </div>
    );
  }
}

export default Api;
