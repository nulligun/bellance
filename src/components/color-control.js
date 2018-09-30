import React from 'react'
import reactCSS from 'reactcss'
import { CompactPicker } from 'react-color'

class ColorControl extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			displayColorPicker: false,
			color: props.color,
		}
	}

	handleClick = () => {
		this.setState({ displayColorPicker: !this.state.displayColorPicker })
	};

	handleClose = () => {
		this.setState({ displayColorPicker: false })
	};

	handleChange = (color) => {
		this.setState({ color: color.rgb })
		this.props.onChange(color);
	};

	render() {

		const styles = reactCSS({
			'default': {
				color: {
					width: '36px',
					height: '36px',
					borderRadius: '2px',
					background: `rgba(${ this.state.color.r }, ${ this.state.color.g }, ${ this.state.color.b }, ${ this.state.color.a })`,
				},
				swatch: {
					padding: '1px',
					background: '#fff',
					borderRadius: '1px',
					boxShadow: '0 0 0 1px rgba(0,0,0,.1)',
					display: 'inline-block',
					cursor: 'pointer',
				},
				popover: {
					position: 'absolute',
					zIndex: '2',
				},
				cover: {
					position: 'fixed',
					top: '0px',
					right: '0px',
					bottom: '0px',
					left: '0px',
				},
			},
		});

		return (
			<div>
				<div style={ styles.swatch } onClick={ this.handleClick }>
					<div style={ styles.color } />
				</div>
				{ this.state.displayColorPicker ? <div style={ styles.popover }>
					<div style={ styles.cover } onClick={ this.handleClose }/>
					<CompactPicker color={ this.state.color } onChange={ this.handleChange } />
				</div> : null }

			</div>
		)
	}
}

export default ColorControl;