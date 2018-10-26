import React, { Component } from 'react';

class Address extends Component {
	constructor(props) {
		super(props);
		this.addressChanged = this.addressChanged.bind(this);

		var self = this;
		window.ee.addListener('addressError', function(error) {
			self.setState({has_error: true, error_message: error});
		});

		var address = localStorage.getItem('address') || '0xF08d00694Ff9aDbE37960030fE622EdEa35Eb48F';

		this.state = {
			has_error: false,
			error_message: '',
			address: address
		}
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
	}

	render() {
		return (
			<div className={"address" + ((this.state.has_error === true) ? ' error' : '')}>
				<input type="text" value={this.state.address} onChange={this.addressChanged} />
				{this.state.has_error && <div className="error-message">{this.state.error_message}</div>}
			</div>
		)
	}
}

export default Address;