const axios = require('axios');
const axiosRetry = require('axios-retry');

axiosRetry(axios, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
});

module.exports = {
  // Axios concurrency limiting mechanism,
  // taken from https://gist.github.com/matthewsuan/2bdc9e7f459d5b073d58d1ebc0613169
  getLimitingAxios(MAX_REQUESTS_COUNT, INTERVAL_MS){
    let PENDING_REQUESTS = 0
    const api = axios.create({})
    api.interceptors.request.use(function (config) {
      return new Promise((resolve) => {
        let interval = setInterval(() => {
          if (PENDING_REQUESTS < MAX_REQUESTS_COUNT) {
            PENDING_REQUESTS++
            clearInterval(interval)
            resolve(config)
          }
        }, INTERVAL_MS)
      })
    })

    api.interceptors.response.use(function (response) {
      PENDING_REQUESTS = Math.max(0, PENDING_REQUESTS - 1)
      return Promise.resolve(response)
    }, function (error) {
      PENDING_REQUESTS = Math.max(0, PENDING_REQUESTS - 1)
      return Promise.reject(error)
    })
    return api
  }

}
