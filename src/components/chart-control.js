import React, { Component } from 'react';
import update from 'immutability-helper';
import { CompactPicker } from 'react-color';
import ColorControl from './color-control';

class ChartControl extends Component {
	constructor(props) {
		super(props);
		this.typeChanged = this.typeChanged.bind(this);
		this.colorChanged = this.colorChanged.bind(this);
		this.labelChanged = this.labelChanged.bind(this);

		this.state = {
			category: this.props.category,
			checked: this.props.checked,
			color: this.props.color,
			chartType: this.props.chartType
		};
	}

	typeChanged(e) {
		let new_chart_type = e.target.value;
		this.setState({chartType: new_chart_type});
		this.props.typeUpdated(this.props.category, new_chart_type);
	}

	colorChanged(c) {
		this.props.colorUpdated(this.props.category, c.hex);
		this.setState({color: c.hex});
	}

	labelChanged(e) {
		this.props.labelUpdated(this.props.category, !this.state.checked);
		this.setState({checked: !this.state.checked});
	}

	render() {
		return (<div className="chart-control">
			<div className="input-group mb-3">
				<div className="input-group-prepend">
					<label className="input-group-text" htmlFor="inputGroupSelect01">{this.props.label}</label>
				</div>
				<select className="custom-select" onChange={this.typeChanged} value={this.state.chartType}>
					<option value="line">Line</option>
					<option value="bar">Bar</option>
					<option value="area">Area</option>
					<option value="hidden">Hidden</option>
				</select>
				<div className="color-control">
					<ColorControl color={this.state.color} onChange={this.colorChanged}/>
				</div>
				<div className="label-enabled">
					<div className="input-group-append">
						<div className="input-group-text">
							<input type="checkbox" checked={this.state.checked && "checked"} onChange={this.labelChanged} />
						</div>
					</div>
				</div>
			</div>
		</div>);
	}
}

export default ChartControl;
