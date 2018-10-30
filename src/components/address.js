import React, { Component } from 'react';
import axios from "axios";

class Address extends Component {
	constructor(props) {
		super(props);
		this.addressChanged = this.addressChanged.bind(this);
		this.checkAddress = this.checkAddress.bind(this);

		var self = this;
		window.ee.addListener('addressError', function(error) {
			self.setState({has_error: true, error_message: error});
		});

		var address = localStorage.getItem('address') || '0xF08d00694Ff9aDbE37960030fE622EdEa35Eb48F';

		this.state = {
			has_error: false,
			error_message: false,
			rank_message: false,
			address: address
		};

		this.checkAddress(this.state.address);
	}

	componentDidMount()
	{
		window.ee.emit('addressChanged', this.state.address);
	}

	addressChanged(e)
	{
		this.setState({address: e.target.value, has_error: false, error_message: ''});
		window.ee.emit('addressChanged', e.target.value);
		localStorage.setItem('address', e.target.value);
		this.checkAddress(e.target.value);
	}

	checkAddress(address)
	{
		window.ee.emit('whale', false);
		window.ee.emit('addressValid', false);
		axios.post('/api/validate_address', {address: address}).then((res) => {
			if (res.data.error) {
				this.setState({has_error: true, rank_message: false, error_message: res.data.message})
			} else {
				let rank_message = false;
				if (res.data.rank)
				{
					let whale = '';
					if (res.data.rank < 101)
					{
						whale = '🐋';
						window.ee.emit('whale', true);
					}
					rank_message = whale + ' ' + Number(res.data.rank).toLocaleString() + " out of " + Number(res.data.total).toLocaleString() + ' ' + whale;
				}
				window.ee.emit('addressValid', true);
				this.setState({has_error: false, error_message: false, rank_message: rank_message});
			}
		});
	}

	render() {
		return (
			<div className={"address" + ((this.state.has_error === true) ? ' error' : '')}>
				<input type="text" value={this.state.address} onChange={this.addressChanged} />
				{this.state.has_error && <div className="error-message">{this.state.error_message}</div>}
				{this.state.rank_message && <div className="rank-message">{this.state.rank_message}</div>}
			</div>
		)
	}
}

export default Address;