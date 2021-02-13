require('dotenv').config()

const _ = require('lodash');
const axios = require('axios');
const axiosRetry = require('axios-retry');
const winston = require('winston');
const BigNumber = require('bignumber.js');

const { CONTRACTS, Network, StableCoinClient } = require('@hover-labs/kolibri-js');

axiosRetry(axios, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
});

const DISCORD_WEBHOOK_TESTNET = process.env.DISCORD_WEBHOOK_TESTNET
const DISCORD_WEBHOOK_MAINNET = process.env.DISCORD_WEBHOOK_MAINNET

if (DISCORD_WEBHOOK_TESTNET === undefined || DISCORD_WEBHOOK_MAINNET === undefined){
  throw new Error("Must set DISCORD_WEBHOOK_TESTNET and DISCORD_WEBHOOK_MAINNET!")
}

const logger = winston.createLogger({
  level: 'debug',
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
      )
    })
  ],
});

const stableCoinClientTestnet = new StableCoinClient(
    'https://rpctest.tzbeta.net',
    Network.Delphi,
    CONTRACTS.DELPHI.OVEN_REGISTRY,
    CONTRACTS.DELPHI.MINTER,
    CONTRACTS.DELPHI.OVEN_FACTORY,
)

const stableCoinClientMainnet = new StableCoinClient(
    'https://rpc.tzbeta.net',
    Network.Mainnet,
    CONTRACTS.MAIN.OVEN_REGISTRY,
    CONTRACTS.MAIN.MINTER,
    CONTRACTS.MAIN.OVEN_FACTORY,
)

const CONTRACT_TYPES = Object.freeze({
  OvenFactory: 1,
  Oven: 2,
})

const OPERATION_HANDLER_MAP = Object.freeze({
  [CONTRACT_TYPES.OvenFactory]: ovenFactoryOperationMessage,
  [CONTRACT_TYPES.Oven]: ovenOperationMessage,
})

logger.info("Starting!")

// Kick off mainnet factory watcher first, then watch all mainnet ovens
watchContract(Network.Mainnet, CONTRACTS.MAIN.OVEN_FACTORY, CONTRACT_TYPES.OvenFactory, 30_000, null)
    .then(async () => {
      const ovens = await stableCoinClientMainnet.getAllOvens()
      for (const {ovenAddress} of ovens) {
        // Sleep for 1s to prevent thundering herd issues
        await new Promise(resolve => setTimeout(resolve, 1000));

        await watchContract(Network.Mainnet, ovenAddress, CONTRACT_TYPES.Oven, 60_000, null)
      }
    })

// Kick off testnet factory watcher first, then watch all testnet ovens
watchContract(Network.Delphi, CONTRACTS.DELPHI.OVEN_FACTORY, CONTRACT_TYPES.OvenFactory, 30_000, null)
    .then(async () => {
      const ovens = await stableCoinClientTestnet.getAllOvens()

      for (const {ovenAddress} of ovens) {
        // Sleep for 1s to prevent thundering herd issues
        await new Promise(resolve => setTimeout(resolve, 1000));
        await watchContract(Network.Delphi, ovenAddress, CONTRACT_TYPES.Oven, 60_000, null)
      }
    })

async function watchContract(network, contractAddress, type, timeout, state) {
  logger.info("Fetching contract data", {network, contractAddress})

  const params = state === null ?
      {params: {status: 'applied'}} :
      {params: {status: 'applied', from: state.latestOpTimestamp + 1}} // +1 as the check server-side is >= so we include the last tx without it

  const response = await axios.get(
      `https://better-call.dev/v1/contract/${network}/${contractAddress}/operations`,
      params
  )

  const operations = _(response.data.operations).filter(op => op.internal === false).value()

  if (operations.length !== 0) {
    const latestOp = _(operations).orderBy('timestamp', 'desc').first()

    // If this is our first run, just update with the operations and move on
    if (state === null){
      state = {
        seenOperations: operations,
      }
    } else {
      // Do notification things here
      logger.info("New operations found!", network, contractAddress, operations)

      for (const operation of operations) {
        // Skip duplicate origination notification on Oven contracts (should never actually happen)
        if (operation.entrypoint === 'makeOven' && type === CONTRACT_TYPES.Oven) { continue }

        await processNewOperation(operation, type)
      }

      state.seenOperations.concat(operations)
    }

    state.latestOpTimestamp = new Date(latestOp.timestamp).getTime()
  } else {
    logger.info("No new operations!", network, contractAddress)
  }

  setTimeout(watchContract.bind(null, network, contractAddress, type, timeout, state), timeout)
}

async function processNewOperation(operation, contractType){
  if (operation.network === 'mainnet'){
    await axios.post(DISCORD_WEBHOOK_MAINNET, {
      content: OPERATION_HANDLER_MAP[contractType](operation)
    })
  } else {
    await axios.post(DISCORD_WEBHOOK_TESTNET, {
      content: OPERATION_HANDLER_MAP[contractType](operation)
    })
  }

  // If we have a `makeOven` call, we need to add a watcher for the new oven
  if (contractType === CONTRACT_TYPES.OvenFactory && operation.entrypoint === 'makeOven'){
    const result = await axios.get('https://better-call.dev/v1/opg/' + operation.hash)
    let newlyCreatedContract = result.data.find(o => o.kind === 'origination').destination
    await watchContract(Network.Delphi, newlyCreatedContract, CONTRACT_TYPES.Oven, 30_000, null)
  }
}

function ovenFactoryOperationMessage(operation){
  if (operation.entrypoint === 'makeOven'){
    return `👨‍🍳 [New oven created](${makeOpLink(operation.network, operation.hash)}) by [${operation.source}](${makeFromLink(operation.network, operation.source)})`
  } else {
    return `📝 [${operation.entrypoint} called on OvenFactory contract](${makeOpLink(operation.network, operation.hash)}) by [${operation.source}](${makeFromLink(operation.network, operation.source)})`
  }
}

function ovenOperationMessage(operation){
  if (operation.entrypoint === 'default') {
    return `💰 [${operation.source}](${makeFromLink(operation.network, operation.source)}) Deposited ${formatXTZ(operation.amount)} XTZ into [their oven](${makeOpLink(operation.network, operation.destination)})`
  } else if (operation.entrypoint === 'borrow'){
      return `💸 [${operation.source}](${makeFromLink(operation.network, operation.source)}) Borrowed ${formatkUSD(operation.parameters.value)} kUSD from [their oven](${makeOpLink(operation.network, operation.destination)})`
  } else if (operation.entrypoint === 'repay'){
    return `💵 [${operation.source}](${makeFromLink(operation.network, operation.source)}) Repaid ${formatkUSD(operation.parameters.value)} kUSD to [their oven](${makeOpLink(operation.network, operation.destination)})`
  } else if (operation.entrypoint === 'withdraw'){
    return `🏧 [${operation.source}](${makeFromLink(operation.network, operation.source)}) Withdrew ${formatXTZ(operation.parameters.value)} kUSD to [their oven](${makeOpLink(operation.network, operation.destination)})`
  } else if (operation.entrypoint === 'liquidate'){
    return `🌊 [${operation.source}](${makeFromLink(operation.network, operation.source)}) Liquidated oven [${operation.destination}](${makeOpLink(operation.network, operation.destination)})`
  } else if (operation.entrypoint === 'setDelegate'){
    return `🎖 [${operation.source}](${makeFromLink(operation.network, operation.source)}) Set oven delegate to [${operation.parameters.value}](${makeBakerLink(operation.network, operation.parameters.value)})`
  } else {
    return `📝 [${operation.entrypoint} called on Oven contract](${makeOpLink(operation.network, operation.hash)}) by [${operation.source}](${makeFromLink(operation.network, operation.source)})`
  }
}

function formatXTZ(amount){
  return new BigNumber(amount).dividedBy(Math.pow(10, 6)).toFixed(2)
}

function formatkUSD(amount){
  return new BigNumber(amount).dividedBy(Math.pow(10, 18)).toFixed(2)
}

function makeBakerLink(network, baker){
  if (network === 'mainnet'){
    return `<https://tzstats.com/${baker}>`
  } else {
    return `<https://delphi.tzstats.com/${baker}>`
  }
}

function makeFromLink(network, fromAddress) {
  return `<https://better-call.dev/${network}/${fromAddress}/operations>`
}

function makeOpLink(network, opHash){
  return `<https://better-call.dev/${network}/opg/${opHash}/contents>`
}

