import React, { Component } from 'react';

class Address extends Component {
	constructor(props) {
		super(props);
		this.addressChanged = this.addressChanged.bind(this);

		var self = this;
		window.ee.addListener('addressError', function(error) {
			self.setState({has_error: true, error_message: error});
		});

		this.state = {
			has_error: false,
			error_message: '',
			address: props.address
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