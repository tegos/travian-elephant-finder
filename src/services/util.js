const config = require('#src/config/index.js');

const randomIntFromInterval = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);

const distance = (x1, y1, x2, y2) => Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);

const isEmpty = (value) =>
  value === null ||
  value === undefined ||
  value === '' ||
  (Array.isArray(value) && value.length === 0) ||
  (typeof value === 'object' && Object.keys(value).length === 0);

const checkConfiguration = () => {
  const requiredOptions = [
    'travian.server',
    'travian.login',
    'travian.password',
    'coordinates.minX',
    'coordinates.minY',
    'coordinates.maxX',
    'coordinates.maxY',
    'coordinates.startX',
    'coordinates.startY',
  ];

  const missing = requiredOptions.filter((opt) => isEmpty(config.get(opt)));

  if (missing.length > 0) {
    console.warn(`Missing required configuration: ${missing.join(', ')}`);
    process.exit(1);
  }
};

exports.distance = distance;
exports.randomIntFromInterval = randomIntFromInterval;
exports.checkConfiguration = checkConfiguration;
exports.isEmpty = isEmpty;
