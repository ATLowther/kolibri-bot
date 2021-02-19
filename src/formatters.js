const BigNumber = require('bignumber.js');

module.exports = {
  ovenFactoryOperationMessage(operation){
    if (operation.entrypoint === 'makeOven'){
      return `👨‍🍳 [New oven created](${this.makeOpLink(operation.network, operation.hash)}) by [${operation.source}](${this.makeFromLink(operation.network, operation.source)})`
    } else {
      return `📝 [${operation.entrypoint} called on OvenFactory contract](${this.makeOpLink(operation.network, operation.hash)}) by [${operation.source}](${this.makeFromLink(operation.network, operation.source)})`
    }
  },

  ovenOperationMessage(operation){
    if (operation.entrypoint === 'default') {
      return `💰 [${operation.source}](${this.makeFromLink(operation.network, operation.source)}) Deposited ${this.formatXTZ(operation.amount)} XTZ into [their oven](${this.makeOpLink(operation.network, operation.destination)})`
    } else if (operation.entrypoint === 'withdraw'){
      return `🏧 [${operation.source}](${this.makeFromLink(operation.network, operation.source)}) Withdrew ${this.formatXTZ(operation.parameters.value)} XTZ from [their oven](${this.makeOpLink(operation.network, operation.destination)})`
    } else if (operation.entrypoint === 'borrow'){
      return `💸 [${operation.source}](${this.makeFromLink(operation.network, operation.source)}) Borrowed ${this.formatkUSD(operation.parameters.value)} kUSD from [their oven](${this.makeOpLink(operation.network, operation.destination)})`
    } else if (operation.entrypoint === 'repay'){
      return `💵 [${operation.source}](${this.makeFromLink(operation.network, operation.source)}) Repaid ${this.formatkUSD(operation.parameters.value)} kUSD to [their oven](${this.makeOpLink(operation.network, operation.destination)})`
    } else if (operation.entrypoint === 'liquidate'){
      return `🌊 [${operation.source}](${this.makeFromLink(operation.network, operation.source)}) Liquidated oven [${operation.destination}](${this.makeOpLink(operation.network, operation.destination)})`
    } else if (operation.entrypoint === 'setDelegate'){
      return `🎖 [${operation.source}](${this.makeFromLink(operation.network, operation.source)}) Set oven delegate to [${operation.parameters.value}](${this.makeBakerLink(operation.network, operation.parameters.value)})`
    } else {
      return `📝 [${operation.entrypoint} called on Oven contract](${this.makeOpLink(operation.network, operation.hash)}) by [${operation.source}](${this.makeFromLink(operation.network, operation.source)})`
    }
  },

  formatXTZ(amount){
    return new BigNumber(amount).dividedBy(Math.pow(10, 6)).toFixed(2)
  },
  formatkUSD(amount){
    return new BigNumber(amount).dividedBy(Math.pow(10, 18)).toFixed(2)
  },
  makeBakerLink(network, baker){
    if (network === 'mainnet'){
      return `<https://tzstats.com/${baker}>`
    } else {
      return `<https://delphi.tzstats.com/${baker}>`
    }
  },
  makeFromLink(network, fromAddress) {
    return `<https://better-call.dev/${network}/${fromAddress}/operations>`
  },
  makeOpLink(network, opHash){
    return `<https://better-call.dev/${network}/opg/${opHash}/contents>`
  },
}
