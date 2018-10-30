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

		var v = 7;
		var version = JSON.parse(localStorage.getItem('version'));
		if ((version === null) || (version < v))
		{
			localStorage.setItem('version', JSON.stringify(v));
			localStorage.setItem('from', null);
			localStorage.setItem('enteredTo', null);
			localStorage.setItem('to', null);
			localStorage.setItem('selectedDays', JSON.stringify([]));
			localStorage.setItem('address', '');
			localStorage.setItem('selectionMode', '');
			localStorage.setItem("balance_chart_type", null);
			localStorage.setItem("delta_chart_type", null);
			localStorage.setItem("spent_chart_type", null);
			localStorage.setItem("earned_chart_type", null);
			localStorage.setItem("difficulty_chart_type", null);
			localStorage.setItem("transactions_chart_type", null);
			localStorage.setItem("balance_color", null);
			localStorage.setItem("delta_color", null);
			localStorage.setItem("spent_color", null);
			localStorage.setItem("earned_color", null);
			localStorage.setItem("difficulty_color", null);
			localStorage.setItem("transactions_color", null);
			localStorage.setItem("balance_label", null);
			localStorage.setItem("delta_label", null);
			localStorage.setItem("spent_label", null);
			localStorage.setItem("earned_label", null);
			localStorage.setItem("difficulty_label", null);
			localStorage.setItem("transactions_label", null);
			localStorage.setItem("balance_yAxisId", null);
			localStorage.setItem("delta_yAxisId", null);
			localStorage.setItem("spent_yAxisId", null);
			localStorage.setItem("earned_yAxisId", null);
			localStorage.setItem("difficulty_yAxisId", null);
			localStorage.setItem("transactions_yAxisId", null);
			localStorage.setItem("width_dimension", null);
			localStorage.setItem("height_dimension", null);
		}

		var from = JSON.parse(localStorage.getItem('from'));
		var enteredTo = JSON.parse(localStorage.getItem('enteredTo'));
		var to = JSON.parse(localStorage.getItem('to'));

		if (from != null) from = new Date(from);
		if (to != null) to = new Date(to);
		if (enteredTo != null) enteredTo = new Date(enteredTo);

		this.state = {
			selectedDays: JSON.parse(localStorage.getItem('selectedDays') || '[]').map((date) => {
				return new Date(date)
			}),
			selectionMode: JSON.parse(localStorage.getItem('selectionMode') || '"day"'),
			from: from,
			to: to,
			whale: false,
			enteredTo: enteredTo
		};

		const self = this;
		this.calendarEnabled = false;
		window.ee.addListener('addressValid', function(v) {
			self.calendarEnabled = v;
		});
		window.ee.addListener('whale', function(v) {
			self.setState({whale: v});
		});

		this.dateList = React.createRef();
	}

	componentDidMount()
	{
		let address = localStorage.getItem('address') || '0xF08d00694Ff9aDbE37960030fE622EdEa35Eb48F';
		if (this.state.selectionMode === "day") {
			this.dateList.current.setup(this.state.selectedDays, address)
		} else {
			var from = JSON.parse(localStorage.getItem('from'));
			var to = JSON.parse(localStorage.getItem('to'));

			if ((from != null) && (to != null)) {
				if (from != null) from = moment(from);
				if (to != null) to = moment(to);
				this.dateList.current.setupDateRange(from, to, address);
			}
		}
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
				localStorage.setItem('enteredTo', JSON.stringify(day));
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
		localStorage.setItem('selectedDays', JSON.stringify(selectedDays));
		this.setState({ selectedDays });
	}

	selectDay(day) {
		const { selectedDays } = this.state;
		this.dateList.current.addDay(day);
		selectedDays.push(day);
		localStorage.setItem('selectedDays', JSON.stringify(selectedDays));
		this.setState({ selectedDays });
	}

	handleDayMouseDown(day, { selected }) {
		if (!this.calendarEnabled) return;
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
		if (!this.calendarEnabled) return;
		if (this.state.selectionMode === 'day') {
			this.mouseDownState = 'none';
		} else {
			const { from, to } = this.state;
			if (from && to && day >= from && day <= to) {
				this.handleResetClick();
				return;
			}
			if (this.isSelectingFirstDay(from, to, day)) {
				localStorage.setItem('from', JSON.stringify(day));
				localStorage.setItem('to', JSON.stringify(null));
				localStorage.setItem('enteredTo', JSON.stringify(null));
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

				localStorage.setItem('to', JSON.stringify(day));
				localStorage.setItem('enteredTo', JSON.stringify(day));

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

		localStorage.setItem('selectionMode', JSON.stringify(e.target.name));
		localStorage.setItem('from', JSON.stringify(null));
		localStorage.setItem('to', JSON.stringify(null));
		localStorage.setItem('enteredTo', JSON.stringify(null));
		localStorage.setItem('selectedDays', JSON.stringify([]));
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
	  var todayDate = moment().add(new Date().getTimezoneOffset(), 'minutes');
		let day_checked = (this.state.selectionMode === "day") ? "checked" : '';
	  let range_checked = (this.state.selectionMode === "range") ? "checked" : '';
    return (
      <div className="App">
	      <div className="intro">
		      <h1>Ella Historical Balance Tool</h1>
	      </div>
	      <Address placeholder="Ellaism address" addressChanged={this.addressChanged}/>
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
				      after: todayDate.toDate()
			      }
			      ]}
	      />
	      <SelectedDateList ref={this.dateList} />
	      <Chart/>
	      {this.state.whale && '🐳'}
      </div>
    );
  }
}

export default App;
