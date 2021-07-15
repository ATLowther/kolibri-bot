const BigNumber = require('bignumber.js');

module.exports = {
  ovenFactoryOperationMessage(operation){
    if (operation.entrypoint === 'makeOven'){
      return `👨‍🍳 [New oven created](${module.exports.makeOpLink(operation.network, operation.hash)}) by [${operation.source}](${module.exports.addressLink(operation.network, operation.source)})`
    } else {
      return `📝 [${operation.entrypoint} called on OvenFactory contract](${module.exports.makeOpLink(operation.network, operation.hash)}) by [${operation.source}](${module.exports.addressLink(operation.network, operation.source)})`
    }
  },

  ovenOperationMessage(operation){
    if (operation.entrypoint === 'default') {
      return `ꜩ ⬇️ [${operation.source}](${module.exports.addressLink(operation.network, operation.source)}) [Deposited](${module.exports.makeOpLink(operation.network, operation.hash)}) ${module.exports.formatXTZ(operation.amount)} XTZ into [their oven](${module.exports.addressLink(operation.network, operation.destination)})`
    } else if (operation.entrypoint === 'withdraw'){
      return `ꜩ ⬆️ [${operation.source}](${module.exports.addressLink(operation.network, operation.source)}) [Withdrew](${module.exports.makeOpLink(operation.network, operation.hash)}) ${module.exports.formatXTZ(operation.parameters[0].value)} XTZ from [their oven](${module.exports.addressLink(operation.network, operation.destination)})`
    } else if (operation.entrypoint === 'repay'){
      return `<:kolibri:790471932025372693> ⬇️ [${operation.source}](${module.exports.addressLink(operation.network, operation.source)}) [Repaid](${module.exports.makeOpLink(operation.network, operation.hash)}) ${module.exports.formatkUSD(operation.parameters[0].value)} kUSD to [their oven](${module.exports.addressLink(operation.network, operation.destination)})`
    } else if (operation.entrypoint === 'borrow'){
      return `<:kolibri:790471932025372693> ⬆️ [${operation.source}](${module.exports.addressLink(operation.network, operation.source)}) [Borrowed](${module.exports.makeOpLink(operation.network, operation.hash)}) ${module.exports.formatkUSD(operation.parameters[0].value)} kUSD from [their oven](${module.exports.addressLink(operation.network, operation.destination)})`
    } else if (operation.entrypoint === 'liquidate'){
      return `🌊 [${operation.source}](${module.exports.addressLink(operation.network, operation.source)}) [Liquidated](${module.exports.makeOpLink(operation.network, operation.hash)}) oven [${operation.destination}](${module.exports.addressLink(operation.network, operation.destination)})`
    } else if (operation.entrypoint === 'setDelegate'){
      return `🎖 [${operation.source}](${module.exports.addressLink(operation.network, operation.source)}) [Set oven delegate](${module.exports.makeOpLink(operation.network, operation.hash)}) to [${operation.parameters[0].value}](${module.exports.makeBakerLink(operation.network, operation.parameters[0].value)})`
    } else {
      return `📝 [${operation.entrypoint} called on Oven contract](${module.exports.makeOpLink(operation.network, operation.hash)}) by [${operation.source}](${module.exports.addressLink(operation.network, operation.source)})`
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
  addressLink(network, address) {
    if (network === 'mainnet'){
      return `<https://tzkt.io/${address}>`
    } else {
      return `<https://delphinet.tzkt.io/${address}>`
    }
  },
  makeOpLink(network, opHash){
    if (network === 'mainnet'){
      return `<https://tzkt.io/${opHash}>`
    } else {
      return `<https://delphinet.tzkt.io/${opHash}>`
    }
  },
}
