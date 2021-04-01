const callable = require('../../util/callable');
const EventCoder = require('./EventCoder');
const LogFilter = require('./LogFilter');

class ContractEvent extends EventCoder {
  constructor(fragment, contract, conflux) {
    super(fragment);
    this.contract = contract;
    this.conflux = conflux;

    return callable(this, this.call.bind(this));
  }

  call(...args) {
    const address = this.contract.address; // dynamic get `contract.address`
    const topics = this.encodeTopics(args);

    let data;
    try {
      data = this.encodeData(args);
    } catch (e) {
      // `data` not filter key
    }

    return new LogFilter({ address, topics, data }, this);
  }
}

module.exports = ContractEvent;
