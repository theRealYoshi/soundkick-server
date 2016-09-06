import React from 'react';
import {Link} from 'react-router';
import OverviewStore from '../stores/OverviewStore'
import OverviewActions from '../actions/OverviewActions';
import ApiActions from '../actions/ApiActions';

class Overview extends React.Component {

    constructor(props) {
        super(props);
        this.state = OverviewStore.getState();
        this.onChange = this.onChange.bind(this);
    }

    componentDidMount() {
        OverviewStore.listen(this.onChange);
        ApiActions.checkAccessToken({history: this.props.history});
    }

    componentWillUnmount() {
        OverviewStore.unlisten(this.onChange);
    }

    onChange(state) {
        console.log('state changed...');
        this.setState(state);
    }

    _apiCall(){
        var payload = {
            apiUrl: '/me/',
            history: this.props.history
        }
        ApiActions.checkAccessToken({ history: this.props.history}, function(){
            ApiActions.soundcloudApiGet(payload, function(results){
                results.apiUrl = payload.apiUrl;
                OverviewActions.parseResults(results);
            });
        });
    }

    render() {
        console.log("rendering...");
        return (
          <div className='container'>
            <div className='row'>
              At Overview Page
              <div className=''>
                <div>
                    <ul>
                        <li>{this.state.city}</li>
                    </ul>
                </div>
              </div>
            </div>
          </div>
        );
    }
}

export default Overview;
