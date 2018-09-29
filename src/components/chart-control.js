import React, { Component } from 'react';
import update from 'immutability-helper';
import { CompactPicker } from 'react-color';
import ColorControl from './color-control';

class ChartControl extends Component {
	constructor(props) {
		super(props);
		this.typeChanged = this.typeChanged.bind(this);
		this.colorChanged = this.colorChanged.bind(this);

		this.state = {
			category: this.props.category
		};
	}

	typeChanged(e) {
		let new_chart_type = e.target.value;
		this.setState({chart_type: new_chart_type});
		this.props.typeUpdated(this.props.category, new_chart_type);
	}

	colorChanged(c) {
		this.props.colorUpdated(this.props.category, c.hex);
	}

	render() {
		return (<div className="chart-control">
			<label>{this.props.label}</label>
			<select onChange={this.typeChanged}>
				<option value="line">Line</option>
				<option value="bar">Bar</option>
				<option value="hidden">Hidden</option>
			</select>
			<ColorControl onChange={this.colorChanged}/>
		</div>);
	}
}

export default ChartControl;
