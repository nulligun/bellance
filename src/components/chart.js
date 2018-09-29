import React, { Component } from 'react';
import { ComposedChart, Line, Area, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import moment from 'moment';
import update from 'immutability-helper';
import ChartControl from './chart-control';
import domtoimage from 'dom-to-image';
import fileDownload from "js-file-download";

class Chart extends Component {
	constructor(props) {
		super(props);
		let self = this;

		this.typeUpdated = this.typeUpdated.bind(this);
		this.colorUpdated = this.colorUpdated.bind(this);
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
				balance: '#413ea0',
				delta: '#413ea0',
				spent: '#413ea0',
				earned: '#413ea0'
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
			<ComposedChart width={this.state.dimensions.width} height={this.state.dimensions.height} data={this.state.data}>
				<CartesianGrid strokeDasharray="3 3" />
				<XAxis dataKey="date" />
				<YAxis />
				<Tooltip />
				<Legend />
				{this.state.chart_type.balance !== 'hidden' && <BalanceChart dataKey="balance" barSize={20} fill={this.state.chart_color.balance} stroke={this.state.chart_color.balance} />}
				{this.state.chart_type.delta !== 'hidden' && <DeltaChart dataKey="delta" barSize={20} fill={this.state.chart_color.delta} stroke={this.state.chart_color.delta} />}
				{this.state.chart_type.earned !== 'hidden' && <EarnedChart dataKey="earned" barSize={20} fill={this.state.chart_color.earned} stroke={this.state.chart_color.earned} />}
				{this.state.chart_type.spent !== 'hidden' && <SpentChart dataKey="spent" barSize={20} fill={this.state.chart_color.spent} stroke={this.state.chart_color.spent} />}
			</ComposedChart>
			</div>
			<div className="chart-download" onClick={this.downloadChart}>Download</div>
			<div className="chart-controls">
				<div className="dimensions">
					<p>Graph Dimensions</p>
					<div>
						<label>X</label>
						<input value={this.state.dimensions.width} type="text" name="width" onChange={this.dimensionUpdated} />
						<label>Y</label>
						<input value={this.state.dimensions.height} type="text" name="height" onChange={this.dimensionUpdated} />
					</div>
				</div>
				<ChartControl label="Balance Chart" category="balance" typeUpdated={this.typeUpdated} colorUpdated={this.colorUpdated} />
				<ChartControl label="Delta Chart" category="delta" typeUpdated={this.typeUpdated} colorUpdated={this.colorUpdated} />
				<ChartControl label="Earned Chart" category="earned" typeUpdated={this.typeUpdated} colorUpdated={this.colorUpdated} />
				<ChartControl label="Spent Chart" category="spent" typeUpdated={this.typeUpdated} colorUpdated={this.colorUpdated} />
			</div>
		</div>
		);
	}
}

export default Chart;