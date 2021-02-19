const BigNumber = require('bignumber.js');

module.exports = {
  ovenFactoryOperationMessage(operation){
    if (operation.entrypoint === 'makeOven'){
      return `👨‍🍳 [New oven created](${module.exports.makeOpLink(operation.network, operation.hash)}) by [${operation.source}](${module.exports.makeFromLink(operation.network, operation.source)})`
    } else {
      return `📝 [${operation.entrypoint} called on OvenFactory contract](${module.exports.makeOpLink(operation.network, operation.hash)}) by [${operation.source}](${module.exports.makeFromLink(operation.network, operation.source)})`
    }
  },

  ovenOperationMessage(operation){
    if (operation.entrypoint === 'default') {
      return `💰 [${operation.source}](${module.exports.makeFromLink(operation.network, operation.source)}) Deposited ${module.exports.formatXTZ(operation.amount)} XTZ into [their oven](${module.exports.makeOpLink(operation.network, operation.destination)})`
    } else if (operation.entrypoint === 'withdraw'){
      return `🏧 [${operation.source}](${module.exports.makeFromLink(operation.network, operation.source)}) Withdrew ${module.exports.formatXTZ(operation.parameters.value)} XTZ from [their oven](${module.exports.makeOpLink(operation.network, operation.destination)})`
    } else if (operation.entrypoint === 'borrow'){
      return `💸 [${operation.source}](${module.exports.makeFromLink(operation.network, operation.source)}) Borrowed ${module.exports.formatkUSD(operation.parameters.value)} kUSD from [their oven](${module.exports.makeOpLink(operation.network, operation.destination)})`
    } else if (operation.entrypoint === 'repay'){
      return `💵 [${operation.source}](${module.exports.makeFromLink(operation.network, operation.source)}) Repaid ${module.exports.formatkUSD(operation.parameters.value)} kUSD to [their oven](${module.exports.makeOpLink(operation.network, operation.destination)})`
    } else if (operation.entrypoint === 'liquidate'){
      return `🌊 [${operation.source}](${module.exports.makeFromLink(operation.network, operation.source)}) Liquidated oven [${operation.destination}](${module.exports.makeOpLink(operation.network, operation.destination)})`
    } else if (operation.entrypoint === 'setDelegate'){
      return `🎖 [${operation.source}](${module.exports.makeFromLink(operation.network, operation.source)}) Set oven delegate to [${operation.parameters.value}](${module.exports.makeBakerLink(operation.network, operation.parameters.value)})`
    } else {
      return `📝 [${operation.entrypoint} called on Oven contract](${module.exports.makeOpLink(operation.network, operation.hash)}) by [${operation.source}](${module.exports.makeFromLink(operation.network, operation.source)})`
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
