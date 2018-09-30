import React, { Component } from 'react';
import { ComposedChart, Line, Area, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import moment from 'moment';
import update from 'immutability-helper';
import ChartControl from './chart-control';
import domtoimage from 'dom-to-image';
import fileDownload from "js-file-download";

import createReactClass from 'create-react-class';

const CustomizedAxisTick = createReactClass({
	render () {
		const {x, y, stroke, payload} = this.props;

		return (
			<g transform={`translate(${x},${y})`}>
				<text x={0} y={0} dy={16} textAnchor="end" fill="#666" transform="rotate(-35)">{payload.value}</text>
			</g>
		);
	}
});

const CustomizedLabel = createReactClass({
	render () {
		const {x, y, stroke, value} = this.props;

		return <text x={x} y={y} dy={-4} fill={stroke} fontSize={10} textAnchor="middle">{Math.round(value)}</text>
	}
});

class Chart extends Component {
	constructor(props) {
		super(props);
		let self = this;

		this.typeUpdated = this.typeUpdated.bind(this);
		this.colorUpdated = this.colorUpdated.bind(this);
		this.labelUpdated = this.labelUpdated.bind(this);
		this.dimensionUpdated = this.dimensionUpdated.bind(this);

		this.state = {
			data: [],
			chart_type: {
				balance: 'line',
				delta: 'line',
				spent: 'line',
				earned: 'line'
			},
			chart_color: {
				balance: '#4D4D4D',
				delta: '#FCC400',
				spent: '#A4DD00',
				earned: '#9F0500'
			},
			chart_label: {
				balance: true,
				delta: false,
				spent: false,
				earned: false
			},
			dimensions: {
				width: 640,
				height: 320
			}
		};

		window.ee.addListener('dataCleared', function() {
			self.setState({data: []});
		});
		window.ee.addListener('dataReceived', function(dates) {
			let new_data = JSON.parse(JSON.stringify(self.state.data));
			dates.forEach((data) => {
				data['date'] = moment.unix(data.id).utc().format('YYYY-MM-DD');
				data['id'] = data.id;
				new_data.push(data);
			});
			new_data.sort((a, b) => (a.id > b.id) ? 1 : ((b.id > a.id) ? -1 : 0));
			self.setState({data: new_data});
		});
		window.ee.addListener('dataRemoved', function(day) {
			let new_data = [];
			for (let i = 0; i < self.state.data.length; i++) {
				if (self.state.data[i]['id'] != day)
				{
					new_data.push(self.state.data[i]);
					//self.setState(update(self.state, {data: {$splice: [[i, 1]]}}));
					//return;
				}
			}
			self.setState(update(self.state, {$set: {data: new_data}}));
		});
	}

	hexToRgb(hex) {
		var h = hex.substr(1);
		var bigint = parseInt(h, 16);
		var r = (bigint >> 16) & 255;
		var g = (bigint >> 8) & 255;
		var b = bigint & 255;

		return {r: r, g: g, b: b, a: 1};
	}

	typeUpdated(category, chart_type)
	{
		let up = {chart_type: {}};
		up.chart_type[category] = {$set: chart_type};
		this.setState(update(this.state, up));
	}

	colorUpdated(category, color)
	{
		let up = {chart_color: {}};
		up.chart_color[category] = {$set: color};
		this.setState(update(this.state, up));
	}

	labelUpdated(category, enabled)
	{
		let up = {chart_label: {}};
		up.chart_label[category] = {$set: enabled};
		this.setState(update(this.state, up));
	}

	chartTypeFor(chart_type)
	{
		switch (chart_type) {
			case 'line': return Line; break;
			case 'bar': return Bar; break;
			case 'area': return Area; break;
		}
	}

	downloadChart()
	{
		domtoimage.toBlob(document.getElementById('chart-image'))
			.then(function (blob) {
				fileDownload(blob, 'ella-chart.png');
			});
	}

	dimensionUpdated(e)
	{
		let up = {dimensions: {}};
		up.dimensions[e.target.name] = {$set: parseInt(e.target.value)};
		this.setState(update(this.state, up));
	}

	render() {
		let BalanceChart = this.chartTypeFor(this.state.chart_type.balance);
		let DeltaChart = this.chartTypeFor(this.state.chart_type.delta);
		let EarnedChart = this.chartTypeFor(this.state.chart_type.earned);
		let SpentChart = this.chartTypeFor(this.state.chart_type.spent);

		return (
		<div className="chart-section">
			<div id="chart-image">
			<ComposedChart width={this.state.dimensions.width} height={this.state.dimensions.height} data={this.state.data} margin={{top: 0, right: 0, left: 0, bottom: 60}}>
				<CartesianGrid strokeDasharray="3 3" />
				<XAxis dataKey="date" tick={<CustomizedAxisTick/>} />
				<YAxis />
				<Tooltip />
				<Legend verticalAlign="top" height={36}/>
				{this.state.chart_type.balance !== 'hidden' && <BalanceChart label={this.state.chart_label.balance && <CustomizedLabel />} dataKey="balance" barSize={20} fill={this.state.chart_color.balance} stroke={this.state.chart_color.balance} />}
				{this.state.chart_type.delta !== 'hidden' && <DeltaChart label={this.state.chart_label.delta && <CustomizedLabel />} dataKey="delta" barSize={20} fill={this.state.chart_color.delta} stroke={this.state.chart_color.delta} />}
				{this.state.chart_type.earned !== 'hidden' && <EarnedChart label={this.state.chart_label.earned && <CustomizedLabel />} dataKey="earned" barSize={20} fill={this.state.chart_color.earned} stroke={this.state.chart_color.earned} />}
				{this.state.chart_type.spent !== 'hidden' && <SpentChart label={this.state.chart_label.spent && <CustomizedLabel />} dataKey="spent" barSize={20} fill={this.state.chart_color.spent} stroke={this.state.chart_color.spent} />}
			</ComposedChart>
			</div>
			<button className="chart-download btn btn-primary" onClick={this.downloadChart}>Download PNG</button>
			<div className="chart-controls">
				<div className="dimensions">
					<div>
						<div className="input-group mb-3">
							<div className="input-group-prepend">
								<span className="input-group-text">Width</span>
							</div>
							<input value={this.state.dimensions.width} type="text" name="width" onChange={this.dimensionUpdated} />
							<input value={this.state.dimensions.height} type="text" name="height" onChange={this.dimensionUpdated} />
							<div className="input-group-append">
								<span className="input-group-text">Height</span>
							</div>
						</div>
					</div>
				</div>
				<ChartControl label="Balance Chart" category="balance" checked={this.state.chart_label.balance} color={this.hexToRgb(this.state.chart_color.balance)} typeUpdated={this.typeUpdated} colorUpdated={this.colorUpdated} labelUpdated={this.labelUpdated} />
				<ChartControl label="Delta Chart" category="delta" checked={this.state.chart_label.delta} color={this.hexToRgb(this.state.chart_color.delta)} typeUpdated={this.typeUpdated} colorUpdated={this.colorUpdated} labelUpdated={this.labelUpdated} />
				<ChartControl label="Earned Chart" category="earned" checked={this.state.chart_label.earned} color={this.hexToRgb(this.state.chart_color.earned)} typeUpdated={this.typeUpdated} colorUpdated={this.colorUpdated} labelUpdated={this.labelUpdated} />
				<ChartControl label="Spent Chart" category="spent" checked={this.state.chart_label.spent} color={this.hexToRgb(this.state.chart_color.spent)} typeUpdated={this.typeUpdated} colorUpdated={this.colorUpdated} labelUpdated={this.labelUpdated} />
			</div>
		</div>
		);
	}
}

export default Chart;