const axios = require('axios');
const config = require('#src/config');

const axiosDefaultInstance = axios.create();

axiosDefaultInstance.defaults.withCredentials = true;
axiosDefaultInstance.defaults.headers.common.cookie = config.authorization.cookie;
axiosDefaultInstance.defaults.headers.common['User-Agent'] = config.userAgent;

module.exports = axiosDefaultInstance;
