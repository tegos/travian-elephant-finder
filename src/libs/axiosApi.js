const axios = require('axios');
const auth = require('#src/services/auth.js');
const config = require('#src/config/index.js');

const axiosApiInstance = axios.create({ timeout: 10000 });

// Request interceptor for API calls
axiosApiInstance.interceptors.request.use(
  (AxiosConfig) => {
    const newAxiosConfig = AxiosConfig;
    newAxiosConfig.headers = {
      cookie: config.getCookie(),
      'User-Agent': config.userAgent,
    };

    return newAxiosConfig;
  },
  (error) => Promise.reject(error),
);

// Response interceptor for API calls
axiosApiInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response && error.response.status === 401 && !originalRequest.isRetry) {
      originalRequest.isRetry = true;
      await auth.login();
      return axiosApiInstance(originalRequest);
    }
    return Promise.reject(error);
  },
);

module.exports = axiosApiInstance;
