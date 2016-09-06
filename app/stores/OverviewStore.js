import alt from '../alt';
import OverviewActions from '../actions/OverviewActions';

class OverviewStore {
	constructor() {
		this.bindActions(OverviewActions);
		this.firstName = '';
		this.username = '';
		this.city = '';
	}

	onParseResults(results){
		switch(results.apiUrl){
			case "/me/":
				console.log("/me/");
				this.profileAttributes(results);
				break;
			default:
				console.log('default');
				break;
		}
	}

	profileAttributes(results){
		this.firstName = results.first_name ? results.first_name : '';
		this.username = results.username ? results.username : '';
		this.city = results.city ? results.city : '';
		console.log(this.city);
		console.log(results);
	}

}

export default alt.createStore(OverviewStore);
