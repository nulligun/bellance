import React, { Component } from 'react';
import { ComposedChart, Line, Area, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import moment from 'moment';
import update from 'immutability-helper';
import ChartControl from './chart-control';
import domtoimage from 'dom-to-image';
import fileDownload from "js-file-download";

import createReactClass from 'create-react-class';
import Formatters from "../classes/formatters";

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

const CustomizedYAxisTickLeft = createReactClass({
	render () {
		const {x, y, stroke, payload} = this.props;

		return (
			<g transform={`translate(${x},${y})`}>
				<text x={0} y={0} dy={16} textAnchor="end" fill="#666">{Formatters.difficulty(payload.value)}</text>
			</g>
		);
	}
});

const CustomizedYAxisTickRight = createReactClass({
	render () {
		const {x, y, stroke, payload} = this.props;

		return (
			<g transform={`translate(${x},${y})`}>
				<text x={0} y={0} dy={16} textAnchor="begin" fill="#666">{Formatters.difficulty(payload.value)}</text>
			</g>
		);
	}
});

const CustomizedLabel = createReactClass({
	render () {
		const {x, y, stroke, value} = this.props;

		return <text x={x} y={y} dy={-4} fill={stroke} fontSize={10} textAnchor="middle">{Formatters.difficulty(value)}</text>
	}
});

class Chart extends Component {
	constructor(props) {
		super(props);
		let self = this;

		this.typeUpdated = this.typeUpdated.bind(this);
		this.colorUpdated = this.colorUpdated.bind(this);
		this.labelUpdated = this.labelUpdated.bind(this);
		this.axisUpdated = this.axisUpdated.bind(this);
		this.dimensionUpdated = this.dimensionUpdated.bind(this);

		let balance_label = JSON.parse(localStorage.getItem("balance_label"));
		let delta_label = JSON.parse(localStorage.getItem("delta_label"));
		let spent_label = JSON.parse(localStorage.getItem("spent_label"));
		let earned_label = JSON.parse(localStorage.getItem("earned_label"));
		let difficulty_label = JSON.parse(localStorage.getItem("difficulty_label"));
		let transactions_label = JSON.parse(localStorage.getItem("transactions_label"));

		this.state = {
			data: [],
			yAxisId: {
				balance: JSON.parse(localStorage.getItem("balance_yAxisId")) || 'left',
				delta: JSON.parse(localStorage.getItem("delta_yAxisId")) || 'left',
				spent: JSON.parse(localStorage.getItem("spent_yAxisId")) || 'left',
				earned: JSON.parse(localStorage.getItem("earned_yAxisId")) || 'left',
				difficulty: JSON.parse(localStorage.getItem("difficulty_yAxisId")) || 'right',
				transactions: JSON.parse(localStorage.getItem("transactions_yAxisId")) || 'left',
			},
			chart_type: {
				balance: JSON.parse(localStorage.getItem("balance_chart_type")) || 'bar',
				delta: JSON.parse(localStorage.getItem("delta_chart_type")) || 'hidden',
				spent: JSON.parse(localStorage.getItem("spent_chart_type")) || 'hidden',
				earned: JSON.parse(localStorage.getItem("earned_chart_type")) || 'hidden',
				difficulty: JSON.parse(localStorage.getItem("difficulty_chart_type")) || 'line',
				transactions: JSON.parse(localStorage.getItem("transactions_chart_type")) || 'hidden',
			},
			chart_color: {
				balance: JSON.parse(localStorage.getItem("balance_color")) || '#4D4D4D',
				delta: JSON.parse(localStorage.getItem("delta_color")) || '#FCC400',
				spent: JSON.parse(localStorage.getItem("spent_color")) || '#A4DD00',
				earned: JSON.parse(localStorage.getItem("earned_color")) || '#9F0500',
				difficulty: JSON.parse(localStorage.getItem("difficulty_color")) || '#FA28FF',
				transactions: JSON.parse(localStorage.getItem("transactions_color")) || '#194D33'
			},
			chart_label: {
				balance: typeof(balance_label) === "boolean" ? balance_label : true,
				delta: typeof(delta_label) === "boolean" ? delta_label : false,
				spent: typeof(spent_label) === "boolean" ? spent_label : false,
				earned: typeof(earned_label) === "boolean" ? earned_label : false,
				difficulty: typeof(difficulty_label) === "boolean" ? difficulty_label : false,
				transactions: typeof(transactions_label) === "boolean" ? transactions_label : false,
			},
			dimensions: {
				width: JSON.parse(localStorage.getItem("width_dimension")) || 640,
				height: JSON.parse(localStorage.getItem("height_dimension")) || 320
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
		localStorage.setItem(category + '_chart_type', JSON.stringify(chart_type));
		this.setState(update(this.state, up));
	}

	colorUpdated(category, color)
	{
		let up = {chart_color: {}};
		up.chart_color[category] = {$set: color};
		localStorage.setItem(category + '_color', JSON.stringify(color));
		this.setState(update(this.state, up));
	}

	axisUpdated(category, id)
	{
		let up = {yAxisId: {}};
		up.yAxisId[category] = {$set: id};
		localStorage.setItem(category + '_yAxisId', JSON.stringify(id));
		this.setState(update(this.state, up));
	}

	labelUpdated(category, enabled)
	{
		let up = {chart_label: {}};
		up.chart_label[category] = {$set: enabled};
		localStorage.setItem(category + '_label', JSON.stringify(enabled));
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
		localStorage.setItem(e.target.name + '_dimension', JSON.stringify(parseInt(e.target.value)));
		this.setState(update(this.state, up));
	}

	render() {
		let BalanceChart = this.chartTypeFor(this.state.chart_type.balance);
		let DeltaChart = this.chartTypeFor(this.state.chart_type.delta);
		let EarnedChart = this.chartTypeFor(this.state.chart_type.earned);
		let SpentChart = this.chartTypeFor(this.state.chart_type.spent);
		let DifficultyChart = this.chartTypeFor(this.state.chart_type.difficulty);
		let TransactionsChart = this.chartTypeFor(this.state.chart_type.transactions);

		return (
		<div className="chart-section">
			<div id="chart-image">
			<ComposedChart width={this.state.dimensions.width} height={this.state.dimensions.height} data={this.state.data} margin={{top: 0, right: 0, left: 0, bottom: 60}}>
				<CartesianGrid strokeDasharray="3 3" />
				<XAxis dataKey="date" tick={<CustomizedAxisTick/>} />
				<YAxis yAxisId="left" tick={<CustomizedYAxisTickLeft/>} width={100}/>
				<YAxis yAxisId="right" tick={<CustomizedYAxisTickRight/>} width={100} orientation="right" />
				<Tooltip />
				<Legend verticalAlign="top" height={36}/>
				{this.state.chart_type.balance !== 'hidden' && <BalanceChart yAxisId={this.state.yAxisId.balance} label={this.state.chart_label.balance && <CustomizedLabel />} dataKey="balance" barSize={20} fill={this.state.chart_color.balance} stroke={this.state.chart_color.balance} />}
				{this.state.chart_type.delta !== 'hidden' && <DeltaChart yAxisId={this.state.yAxisId.delta} label={this.state.chart_label.delta && <CustomizedLabel />} dataKey="delta" barSize={20} fill={this.state.chart_color.delta} stroke={this.state.chart_color.delta} />}
				{this.state.chart_type.earned !== 'hidden' && <EarnedChart yAxisId={this.state.yAxisId.earned} label={this.state.chart_label.earned && <CustomizedLabel />} dataKey="earned" barSize={20} fill={this.state.chart_color.earned} stroke={this.state.chart_color.earned} />}
				{this.state.chart_type.spent !== 'hidden' && <SpentChart yAxisId={this.state.yAxisId.spent} label={this.state.chart_label.spent && <CustomizedLabel />} dataKey="spent" barSize={20} fill={this.state.chart_color.spent} stroke={this.state.chart_color.spent} />}
				{this.state.chart_type.difficulty !== 'hidden' && <DifficultyChart yAxisId={this.state.yAxisId.difficulty} label={this.state.chart_label.difficulty && <CustomizedLabel />} dataKey="difficulty" barSize={20} fill={this.state.chart_color.difficulty} stroke={this.state.chart_color.difficulty} />}
				{this.state.chart_type.transactions !== 'hidden' && <TransactionsChart yAxisId={this.state.yAxisId.transactions} label={this.state.chart_label.transactions && <CustomizedLabel />} dataKey="transactions" barSize={20} fill={this.state.chart_color.transactions} stroke={this.state.chart_color.transactions} />}
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
				<ChartControl label="Balance Chart" category="balance" chartType={this.state.chart_type.balance} checked={this.state.chart_label.balance} color={this.hexToRgb(this.state.chart_color.balance)} yAxisId={this.state.yAxisId.balance} axisUpdated={this.axisUpdated} typeUpdated={this.typeUpdated} colorUpdated={this.colorUpdated} labelUpdated={this.labelUpdated} />
				<ChartControl label="Delta Chart" category="delta" chartType={this.state.chart_type.delta} checked={this.state.chart_label.delta} color={this.hexToRgb(this.state.chart_color.delta)} yAxisId={this.state.yAxisId.delta} axisUpdated={this.axisUpdated} typeUpdated={this.typeUpdated} colorUpdated={this.colorUpdated} labelUpdated={this.labelUpdated} />
				<ChartControl label="Earned Chart" category="earned" chartType={this.state.chart_type.earned} checked={this.state.chart_label.earned} color={this.hexToRgb(this.state.chart_color.earned)} yAxisId={this.state.yAxisId.earned} axisUpdated={this.axisUpdated} typeUpdated={this.typeUpdated} colorUpdated={this.colorUpdated} labelUpdated={this.labelUpdated} />
				<ChartControl label="Spent Chart" category="spent" chartType={this.state.chart_type.spent} checked={this.state.chart_label.spent} color={this.hexToRgb(this.state.chart_color.spent)} yAxisId={this.state.yAxisId.spent} axisUpdated={this.axisUpdated} typeUpdated={this.typeUpdated} colorUpdated={this.colorUpdated} labelUpdated={this.labelUpdated} />
				<ChartControl label="Difficulty Chart" category="difficulty" chartType={this.state.chart_type.difficulty} checked={this.state.chart_label.difficulty} color={this.hexToRgb(this.state.chart_color.difficulty)} yAxisId={this.state.yAxisId.difficulty} axisUpdated={this.axisUpdated} typeUpdated={this.typeUpdated} colorUpdated={this.colorUpdated} labelUpdated={this.labelUpdated} />
				<ChartControl label="Transaction Chart" category="transactions" chartType={this.state.chart_type.transactions} checked={this.state.chart_label.transactions} color={this.hexToRgb(this.state.chart_color.transactions)} yAxisId={this.state.yAxisId.transactions} axisUpdated={this.axisUpdated} typeUpdated={this.typeUpdated} colorUpdated={this.colorUpdated} labelUpdated={this.labelUpdated} />
			</div>
		</div>
		);
	}
}

export default Chart;