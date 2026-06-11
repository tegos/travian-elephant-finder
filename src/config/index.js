const dotenv = require('dotenv');
const fs = require('node:fs');

dotenv.config();

const config = {
  authorization: {
    cookie: fs.readFileSync('src/config/cookie.txt', 'utf8').trim(),
  },

  travian: {
    server: process.env.TRAVIAN_SERVER,
  },

  userAgent:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',

  coordinates: {
    minX: process.env.MIN_X,
    minY: process.env.MIN_Y,
    maxX: process.env.MAX_X,
    maxY: process.env.MAX_Y,
    startX: process.env.START_X,
    startY: process.env.START_Y,
  },

  delay: {
    min: parseInt(process.env.DELAY_MIN, 10) || 1000,
    max: parseInt(process.env.DELAY_MAX, 10) || 1500,
  },

  jsonFile: {
    oasis: 'data/oasis.json',
    oasisOccupied: 'data/oasis-occupied.json',
  },
};

config.getToken = function getToken() {
  return fs.readFileSync('src/config/token.txt', 'utf8').trim();
};

config.getBearerHeader = function getBearerHeader() {
  const token = this.getToken();
  return `Bearer ${token}`;
};

config.get = function get(option) {
  return option.split('.').reduce((obj, key) => obj?.[key], this);
};

config.setToken = function setToken(token) {
  fs.writeFileSync('src/config/token.txt', token);
};

module.exports = config;
