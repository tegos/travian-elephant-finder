const axios = require('axios');
const auth = require('~src/services/auth');
const config = require('~src/config');

const axiosApiInstance = axios.create();

axiosApiInstance.defaults.withCredentials = true;

// Request interceptor for API calls
axiosApiInstance.interceptors.request.use((AxiosConfig) => {
  const newAxiosConfig = AxiosConfig;
  newAxiosConfig.headers = {
    cookie: config.authorization.cookie,
    Authorization: config.getBearerHeader(),
    'User-Agent': config.userAgent,
  };

  return newAxiosConfig;
}, (error) => Promise.reject(error));

// Response interceptor for API calls
axiosApiInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response.status === 401 && !originalRequest.isRetry) {
      originalRequest.isRetry = true;
      await auth.refreshToken();
      axiosApiInstance.defaults.headers.common.Authorization = config.getBearerHeader();
      console.log(config.getBearerHeader());
      return axiosApiInstance(originalRequest);
    }
    return Promise.reject(error);
  },
);

module.exports = axiosApiInstance;
