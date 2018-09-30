import React, { Component } from 'react';
import './App.css';
import DayPicker, { DateUtils } from 'react-day-picker';
import 'react-day-picker/lib/style.css';
import SelectedDateList from './components/selected-date-list';
import Address from './components/address';
import Chart from './components/chart';
import moment from 'moment';

var {EventEmitter} = require('fbemitter');
window.ee = new EventEmitter();

class App extends Component {
	constructor(props) {
		super(props);
		this.handleDayMouseDown = this.handleDayMouseDown.bind(this);
		this.handleDayMouseUp = this.handleDayMouseUp.bind(this);
		this.handleDayMouseEnter = this.handleDayMouseEnter.bind(this);
		this.selectionModeChanged = this.selectionModeChanged.bind(this);
		this.handleResetClick = this.handleResetClick.bind(this);

		this.state = {
			selectedDays: [],
			selectionMode: 'day',
			from: null,
			to: null,
			enteredTo: null
		};

		this.dateList = React.createRef();
	}

	isSelectingFirstDay(from, to, day) {
		const isBeforeFirstDay = from && DateUtils.isDayBefore(day, from);
		const isRangeSelected = from && to;
		return !from || isBeforeFirstDay || isRangeSelected;
	}

	handleDayMouseEnter(day) {
		if (this.state.selectionMode === 'day') {
			if (this.mouseDownState === 'deselect') {
				this.deselectDay(day);
			} else if (this.mouseDownState === 'select') {
				this.selectDay(day);
			}
		} else {
			const { from, to } = this.state;
			if (!this.isSelectingFirstDay(from, to, day)) {
				this.setState({
					enteredTo: day,
				});
			}
		}
	}

	handleResetClick() {

	}

	deselectDay(day) {
		const { selectedDays } = this.state;
		const selectedIndex = selectedDays.findIndex(selectedDay =>
			DateUtils.isSameDay(selectedDay, day)
		);
		this.dateList.current.removeDay(day);
		selectedDays.splice(selectedIndex, 1);
		this.setState({ selectedDays });
	}

	selectDay(day) {
		const { selectedDays } = this.state;
		this.dateList.current.addDay(day);
		selectedDays.push(day);
		this.setState({ selectedDays });
	}

	handleDayMouseDown(day, { selected }) {
		if (this.state.selectionMode === 'day') {
			if (selected) {
				this.mouseDownState = 'deselect';
				this.deselectDay(day);
			} else {
				this.mouseDownState = 'select';
				this.selectDay(day);
			}
		} else {
			this.dateList.current.clearAll();
			window.ee.emit('dataCleared');
		}
	}

	handleDayMouseUp(day) {
		if (this.state.selectionMode === 'day') {
			this.mouseDownState = 'none';
		} else {
			const { from, to } = this.state;
			if (from && to && day >= from && day <= to) {
				this.handleResetClick();
				return;
			}
			if (this.isSelectingFirstDay(from, to, day)) {
				this.setState({
					from: day,
					to: null,
					enteredTo: null,
				});
			} else {

				this.dateList.current.clearAll();
				window.ee.emit('dataCleared');

				let from = moment(this.state.from);
				let to = moment(day);
				this.dateList.current.addDateRange(from, to);

				this.setState({
					to: day,
					enteredTo: day,
				});
			}
		}
	}

	selectionModeChanged(e)
	{
		this.dateList.current.clearAll();
		window.ee.emit('dataCleared');

		this.setState({selectionMode: e.target.name, from: null, to: null, enteredTo: null, selectedDays: []});
	}

  render() {
		const { from, enteredTo } = this.state;
	  let modifiers = {};
	  let selectedDays = this.state.selectedDays;
	  if (this.state.selectionMode === "range")
	  {
	  	modifiers.start = from;
	  	modifiers.end = enteredTo;
		  selectedDays = [from, { from, to: enteredTo }];
	  }
		let day_checked = (this.state.selectionMode === "day") ? "checked" : '';
	  let range_checked = (this.state.selectionMode === "range") ? "checked" : '';
    return (
      <div className="App">
	      <div className="intro">
		      <h1>Ella Historical Balance Tool</h1>
		      <p>Most likely very broken in the current state but it does do some things right if you are patient. Basic usage:</p>
		      <p>Step 1.  Enter you Ellaism address into the first field.<br/>
			      Step 2.  Click on a date on the calendar and wait.</p>

		      <p>The server is downloading all your transactions from the block chain and storing them in a way that they can be easily queried. This might take a couple minutes if the server is busy or even longer if you have a lot of transactions.  After this initial loading effort is done, the app should respond fairly quickly to other requests.</p>
		      <p>The balance might not be exact and could be off by a few Ella.  This means some transactions did not get properly cached into the database.  If this is a large problem I can rebuild this cache to try to fix it, but it takes a few days.</p>

	      </div>

	      <Address placeholder="Ellaism address" address="0xF08d00694Ff9aDbE37960030fE622EdEa35Eb48F"/>
	      <div className="date-selection-mode">
		      <div className="btn-group btn-group-toggle" data-toggle="buttons">
			      <label className="btn btn-secondary active"><input type="radio" name="day" checked={day_checked} onChange={this.selectionModeChanged} /> Select By Day</label>
			      <label className="btn btn-secondary"><input type="radio" name="range" checked={range_checked} onChange={this.selectionModeChanged} /> Select Range</label>
		      </div>
	      </div>
	      <DayPicker
		      showOutsideDays
		      modifiers={modifiers}
		      selectedDays={selectedDays}
		      onDayMouseDown={this.handleDayMouseDown}
		      onDayMouseUp={this.handleDayMouseUp}
		      onDayMouseEnter={this.handleDayMouseEnter}
		      disabledDays={[
			      {
				      after: new Date()
			      }
			      ]}
	      />
	      <SelectedDateList ref={this.dateList}/>
	      <Chart/>
      </div>
    );
  }
}

export default App;
