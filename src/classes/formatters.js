class Formatters {
	static difficulty(difficulty) {
		let TRILLION = 1000000000000;
		let BILLION = 1000000000;
		let MILLION = 1000000;

		let diffBN = difficulty;

		let res = diffBN;
		if (diffBN >= TRILLION) {
			res = (diffBN / TRILLION).toFixed(3) + 'T';
		} else if (diffBN >= BILLION) {
			res = (diffBN / BILLION).toFixed(3) + 'B';
		} else if (diffBN >= MILLION) {
			res = (diffBN / MILLION).toFixed(3) + 'M';
		}

		return res.toString();
	}
}

export default Formatters;
