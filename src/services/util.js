const config = require('#src/config');

const randomIntFromInterval = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);

const distance = (x1, y1, x2, y2) => Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);

const isEmpty = function isEmpty(value) {
  return (
    value === null ||
    value === undefined ||
    value === '' ||
    (Array.isArray(value) && value.length === 0) ||
    (typeof value === 'object' && Object.keys(value).length === 0)
  );
};

const checkConfiguration = function checkConfiguration() {
  const requiredOptions = [
    'authorization.cookie',
    'travian.server',
    'coordinates.minX',
    'coordinates.minY',
    'coordinates.maxX',
    'coordinates.maxY',
    'coordinates.startX',
    'coordinates.startY',
  ];

  const emptyConfigOptions = [];

  for (let i = 0; i < requiredOptions.length; i++) {
    const option = requiredOptions[i];
    if (isEmpty(config.get(option))) {
      emptyConfigOptions.push(option);
    }
  }

  if (emptyConfigOptions.length > 0) {
    console.warn(`You must provide correct configuration for this option: ${emptyConfigOptions}`);
    process.exit();
  }
};

exports.distance = distance;
exports.randomIntFromInterval = randomIntFromInterval;
exports.checkConfiguration = checkConfiguration;
exports.isEmpty = isEmpty;
