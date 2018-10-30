import React, { Component } from 'react';
import Formatters from '../classes/formatters';

class SelectedDateListItem extends Component {
	render() {
		let balance = Math.round(this.props.balance);
		if (this.props.state === 'pending') {
			balance = 'Loading Balance...';
		}
		return (<tr className="selected-date-list-item">
			<td className="date-item">{this.props.day.format('YYYY-MM-DD')}</td>
			<td className="block-item">{this.props.block}</td>
			<td className="balance-item">{balance}</td>
			<td className="delta-item">{Math.round(this.props.delta)}</td>
			<td className="earned-item">{Math.round(this.props.earned)}</td>
			<td className="spent-item">{Math.round(this.props.spent)}</td>
			<td className="difficulty-item">{Formatters.difficulty(this.props.difficulty)}</td>
			<td className="transactions-item">{Math.round(this.props.transactions)}</td>
		</tr>);
	}
}

export default SelectedDateListItem;