const Web3 = require("web3");

export class Config {
	static web3 = new Web3(new Web3.providers.HttpProvider("https://jsonrpc.ellaism.org"));
}
