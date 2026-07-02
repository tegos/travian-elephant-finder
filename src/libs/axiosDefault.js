const axios = require('axios');
const config = require('#src/config/index.js');

const axiosDefaultInstance = axios.create({ timeout: 10000 });

axiosDefaultInstance.defaults.withCredentials = true;
axiosDefaultInstance.defaults.headers.common.cookie = config.authorization.cookie;
axiosDefaultInstance.defaults.headers.common['User-Agent'] = config.userAgent;

module.exports = axiosDefaultInstance;
