import React, { Component } from 'react';
import SelectedDateListItem from './selected-date-list-item';
import moment from 'moment';
import axios from "axios/index";
import update from 'immutability-helper';
import fileDownload from "js-file-download";
import Formatters from "../classes/formatters";
import { Config } from "../classes/Config";

class SelectedDateList extends Component {
	constructor(props) {
		super(props);
		this.addDay = this.addDay.bind(this);
		this.removeDay = this.removeDay.bind(this);
		this.clearAll = this.clearAll.bind(this);
		this.downloadCSV = this.downloadCSV.bind(this);
		this.getBalances = this.getBalances.bind(this);
		this.state = {
			selectedDays: {},
		};
		this.address = null;
		var self = this;
		window.ee.addListener('addressChanged', function(a) {
			self.address = a;
		});
	}

	setup(days, address)
	{
		let self = this;
		this.state = {
			selectedDays: {},
		};
		this.address = address;
		days.forEach((day) => {
			self.addDay(day);
		});
	}

	clearAll()
	{
		this.setState({selectedDays: {}})
	}

	setupDateRange(from, to, address)
	{
		this.address = address;
		from.utc();
		to.utc();
		let toAdd = {};
		let dates = [];
		to.add(1, 'd');
		while (from.isBefore(to))
		{
			let m = this.endOfDay(from);
			toAdd[m.unix()] = {state: 'pending', day: m, balance: 0, delta: 0, earned: 0, spent: 0, block: 0, difficulty: 0, transactions: 0};
			dates.push({id: m.unix(), timestamp: m.unix(), interval: 60 * 60 * 24});
			from.add(1, 'd');
		}
		let sd = {selectedDays: { ...toAdd, ...this.state.selectedDays}};
		this.setState(sd);
		this.getBalances(dates);
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
			let m = this.endOfDay(from);
			toAdd[m.unix()] = {state: 'pending', day: m, balance: 0, delta: 0, earned: 0, spent: 0, block: 0, difficulty: 0, transactions: 0};
			dates.push({id: m.unix(), timestamp: m.unix(), interval: 60 * 60 * 24});
			from.add(1, 'd');
		}
		let sd = {selectedDays: { ...toAdd, ...this.state.selectedDays}};
		this.setState(sd);

		this.getBalances(dates);
	}

	getBalances(dates)
	{
		let self = this;
		if (this.address === null)
		{
			console.error("Address not defined yet");
		} else {
			console.log("getting balances ");
			console.log(dates);
			axios.post('/api/balance_at_time', {address: this.address, dates: dates}).then((res) => {
				if (res.data.error) {

				} else {
					//NOTE: This pattern is important, the updated object must be created in setState because it's triggered by ajax callback
					self.setState((previousState, currentProps) => {
						let up = {selectedDays: {}};
						res.data.dates.forEach((d, index) => {
							res.data.dates[index]['id'] = d.id;
							up['selectedDays'][d.id] = {$set: {day: moment.unix(d.id).utc(), state: 'complete', balance: d.balance, delta: d.delta, earned: d.earned, spent: d.spent, difficulty: d.difficulty, transactions: d.transactions, block: d.block}};
						});
						window.ee.emit('dataReceived', res.data.dates);
						let newState = update(previousState, up);
						return newState;
					});
				}
			});
		}
	}

	endOfDay(day)
	{
		return moment(day).endOf('day').add(new Date().getTimezoneOffset(), 'minutes');
	}

	addDay(day)
	{
		let m = this.endOfDay(day);
		let toAdd = {};
		toAdd[m.unix()] = {state: 'pending', day: m, balance: 0, delta: 0, earned: 0, spent: 0, block: 0, difficulty: '', transactions: 0};
		let sd = {selectedDays: { ...toAdd, ...this.state.selectedDays}};
		this.setState(sd);
		this.getBalances([{id: m.unix(), timestamp: m.unix(), interval: 60 * 60 * 24}]);
	}

	downloadCSV() {
		let self = this;
		const listItems = Object.keys(this.state.selectedDays).sort((a, b) => this.state.selectedDays[a] === this.state.selectedDays[b].day ? 0 : ((this.state.selectedDays[a].day > this.state.selectedDays[b].day) ? 1 : -1)).map(function(day) {
			let m = self.state.selectedDays[day];
			return m.day.format('YYYY-MM-DD') + ',' + m.block + ',' + m.balance + ',' + m.delta + ',' + m.earned + ',' + m.spent + ',' + m.difficulty + ',' + m.transactions + "\r\n";
		});
		listItems.unshift('Date,Block,Balance,Delta,Earned,Spent,Difficulty,Transactions' + "\r\n");
		let csv_blob = new Blob(listItems, {
			type: 'text/plain'
		});
		fileDownload(csv_blob, 'ella-chart.csv');
	}

	removeDay(day)
	{
		let m = this.endOfDay(day);
		window.ee.emit('dataRemoved', m.unix());
		this.setState(update(this.state, {selectedDays: {$unset: [m.unix()]}}));
	}

	render() {
		let self = this;
		let delta_avg = 0;
		let earned_avg = 0;
		let spent_avg = 0;
		let difficulty_avg = Config.web3.utils.toBN(0);
		let transactions_avg = 0;
		const listItems = Object.keys(this.state.selectedDays).sort((a, b) => this.state.selectedDays[a] === this.state.selectedDays[b].day ? 0 : ((this.state.selectedDays[a].day > this.state.selectedDays[b].day) ? 1 : -1)).map(function(day) {
			let m = self.state.selectedDays[day];
			delta_avg += m.delta;
			earned_avg += m.earned;
			spent_avg += m.spent;
			difficulty_avg = difficulty_avg.add(Config.web3.utils.toBN(m.difficulty));
			transactions_avg += m.transactions;
			return <SelectedDateListItem key={day} day={m.day} block={m.block} state={m.state} balance={m.balance} delta={m.delta} earned={m.earned} spent={m.spent} difficulty={m.difficulty} transactions={m.transactions}/>
		});
		let n = Object.keys(this.state.selectedDays).length;
		if (n > 0) {
			delta_avg = delta_avg / n;
			earned_avg = earned_avg / n;
			spent_avg = spent_avg / n;
			difficulty_avg = difficulty_avg.div(Config.web3.utils.toBN(n));
			transactions_avg = transactions_avg / n;
		} else {
			delta_avg = 0;
			earned_avg = 0;
			spent_avg = 0;
			difficulty_avg = Config.web3.utils.toBN(0);;
			transactions_avg = 0;
		}
		return (<div className="selected-date-list">
				<table cellPadding="0" cellSpacing="0">
					<tbody>
					{listItems.length > 0 &&
					<tr>
						<th className="date-header">Date</th>
						<th className="block-header">Block</th>
						<th className="balance-header">Balance</th>
						<th className="delta-header">Change</th>
						<th className="earned-header">Earned</th>
						<th className="spent-header">Spent</th>
						<th className="difficulty-header">Difficulty</th>
						<th className="transactions-header">Transactions</th>
					</tr>
					}
					{listItems}
					{listItems.length > 0 && <tr><th>&nbsp;</th><th>&nbsp;</th><th>Average</th><th>{delta_avg.toFixed(2)}</th><th>{earned_avg.toFixed(2)}</th><th>{spent_avg.toFixed(2)}</th><th>{Formatters.difficulty(difficulty_avg.toNumber())}</th><th>{transactions_avg.toFixed(2)}</th></tr>}
					</tbody>
				</table>
			{listItems.length > 0 && <button type="button" className="btn btn-primary csv-download" onClick={this.downloadCSV}>Download CSV</button>}
		</div>);
	}
}

export default SelectedDateList;