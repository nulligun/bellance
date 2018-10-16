import React, { Component } from 'react';
import SelectedDateListItem from './selected-date-list-item';
import moment from 'moment';
import axios from "axios/index";
import update from 'immutability-helper';
import fileDownload from "js-file-download";

class SelectedDateList extends Component {
	constructor(props) {
		super(props);
		this.addDay = this.addDay.bind(this);
		this.removeDay = this.removeDay.bind(this);
		this.clearAll = this.clearAll.bind(this);
		this.downloadCSV = this.downloadCSV.bind(this);
		this.getBalances = this.getBalances.bind(this);
		let self = this;
		window.ee.addListener('addressChanged', function(a) {
			self.setState({address: a});
		});
		this.state = {
			selectedDays: {},
			address: null
		};
	}

	clearAll()
	{
		this.setState({selectedDays: {}})
	}

	addDateRange(from, to)
	{
		from.utc();
		to.utc();
		let toAdd = {};
		let dates = [];
		to.add(1, 'd');
		while (from.isBefore(to))
		{
			toAdd[from.unix()] = {state: 'pending', day: moment(from).endOf('day'), balance: 0, delta: 0, earned: 0, spent: 0};
			dates.push({id: from.unix(), timestamp: moment(from).endOf('day').unix(), interval: 60 * 60 * 24});
			from.add(1, 'd');
		}
		let sd = {selectedDays: { ...toAdd, ...this.state.selectedDays}};
		this.setState(sd);

		this.getBalances(dates);
	}

	getBalances(dates)
	{
		var self = this;
		axios.post('/api/balance_at_time', {address: this.state.address, dates: dates}).then((res) => {
			if (res.data.error)
			{
				var up = {selectedDays: {}};
				res.data.dates.forEach((d) => {
					up['selectedDays'][d.id] = {state: {$set: 'error'}};
				});
				window.ee.emit('addressError', res.data.error);
				self.setState(update(self.state, up));
			} else {
				var up = {selectedDays: {}};
				if (res.data.dates) {
					res.data.dates.forEach((d, index) => {
						res.data.dates[index]['id'] = d.id;
						up['selectedDays'][d.id] = {state: {$set: 'complete'}, balance: {$set: d.balance}, delta: {$set: d.delta}, earned: {$set: d.earned}, spent: {$set: d.spent}};
					});
					window.ee.emit('dataReceived', res.data.dates);
				}
				self.setState(update(self.state, up));
			}
		});
	}

	addDay(day)
	{
		let m = moment(day).utc();
		let toAdd = {};
		toAdd[m.unix()] = {state: 'pending', day: moment(m).endOf('day'), balance: 0, delta: 0, earned: 0, spent: 0};
		let sd = {selectedDays: { ...toAdd, ...this.state.selectedDays}};
		this.setState(sd);

		this.getBalances([{id: m.unix(), timestamp: m.endOf('day').unix(), interval: 60 * 60 * 24}]);
	}

	downloadCSV() {
		let self = this;
		const listItems = Object.keys(this.state.selectedDays).sort((a, b) => this.state.selectedDays[a] === this.state.selectedDays[b].day ? 0 : ((this.state.selectedDays[a].day > this.state.selectedDays[b].day) ? 1 : -1)).map(function(day) {
			let m = self.state.selectedDays[day];
			return m.day.format('YYYY-MM-DD') + ',' + m.balance + ',' + m.delta + ',' + m.earned + ',' + m.spent + "\r\n";
		});
		listItems.unshift('Date,Balance,Delta,Earned,Spent' + "\r\n");
		let csv_blob = new Blob(listItems, {
			type: 'text/plain'
		});
		fileDownload(csv_blob, 'ella-chart.csv');
	}

	removeDay(day)
	{
		let m = moment(day).utc();
		window.ee.emit('dataRemoved', m.unix());
		this.setState(update(this.state, {selectedDays: {$unset: [m.unix()]}}));
	}

	render() {
		let self = this;
		let delta_avg = 0;
		let earned_avg = 0;
		let spent_avg = 0;
		const listItems = Object.keys(this.state.selectedDays).sort((a, b) => this.state.selectedDays[a] === this.state.selectedDays[b].day ? 0 : ((this.state.selectedDays[a].day > this.state.selectedDays[b].day) ? 1 : -1)).map(function(day) {
			let m = self.state.selectedDays[day];
			delta_avg += m.delta;
			earned_avg += m.earned;
			spent_avg += m.spent;
			return <SelectedDateListItem key={day} day={m.day} state={m.state} balance={m.balance} delta={m.delta} earned={m.earned} spent={m.spent}/>
		});
		let n = Object.keys(this.state.selectedDays).length;
		if (n > 0) {
			delta_avg = delta_avg / n;
			earned_avg = earned_avg / n;
			spent_avg = spent_avg / n;
		} else {
			delta_avg = 0;
			earned_avg = 0;
			spent_avg = 0;
		}
		return (<div className="selected-date-list">
				<table cellPadding="0" cellSpacing="0">
					<tbody>
					{listItems.length > 0 &&
					<tr>
						<th className="date-header">Date</th>
						<th className="balance-header">Balance</th>
						<th className="delta-header">Change</th>
						<th className="earned-header">Earned</th>
						<th className="spent-header">Spent</th>
					</tr>
					}
					{listItems}
					{listItems.length > 0 && <tr><th>&nbsp;</th><th>Average</th><th>{delta_avg}</th><th>{earned_avg}</th><th>{spent_avg}</th></tr>}
					</tbody>
				</table>
			{listItems.length > 0 && <button type="button" className="btn btn-primary csv-download" onClick={this.downloadCSV}>Download CSV</button>}
		</div>);
	}
}

export default SelectedDateList;