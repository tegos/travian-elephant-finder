const config = require('#src/config/index.js');

const randomIntFromInterval = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);

const distance = (x1, y1, x2, y2) => Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);

const isEmpty = (value) =>
  value === null ||
  value === undefined ||
  value === '' ||
  (Array.isArray(value) && value.length === 0) ||
  (typeof value === 'object' && Object.keys(value).length === 0);

const DEFAULT_DISTANCE = 15;

const checkConfiguration = () => {
  // START_X/START_Y are intentionally optional: when empty they are auto-detected
  // from the active village (see resolveScanCenter). DISTANCE has a safe default.
  const requiredOptions = ['travian.server', 'travian.login', 'travian.password'];

  const missing = requiredOptions.filter((opt) => isEmpty(config.get(opt)));

  if (missing.length > 0) {
    console.warn(`Missing required configuration: ${missing.join(', ')}`);
    process.exit(1);
  }
};

// Reads DISTANCE from config, falling back to a safe default with a warning so a
// non-developer never gets stuck on a missing/invalid value.
const resolveDistance = () => {
  const raw = parseInt(config.coordinates.distance, 10);
  if (!Number.isFinite(raw) || raw <= 0) {
    console.warn(`DISTANCE not set or invalid, using default ${DEFAULT_DISTANCE}.`);
    return DEFAULT_DISTANCE;
  }
  return raw;
};

// Resolves the scan center. If START_X/START_Y are set, they win. Otherwise the
// active village coordinates are fetched from the game and cached back onto config
// so both the collect and find steps share one origin. Requires a valid session.
const resolveScanCenter = async () => {
  const travian = require('#src/services/travian.js');
  const { startX, startY } = config.coordinates;

  if (!isEmpty(startX) && !isEmpty(startY)) {
    return { x: +startX, y: +startY, auto: false };
  }

  const own = await travian.fetchOwnCoordinates();
  if (!own) {
    console.warn(
      'Could not auto-detect village coordinates. Set START_X and START_Y in .env manually.',
    );
    process.exit(1);
  }

  config.coordinates.startX = own.x;
  config.coordinates.startY = own.y;
  return { x: own.x, y: own.y, auto: true };
};

// Every tile whose Euclidean distance from (cx, cy) is within `radius`, walking the
// bounding square and dropping the corners that fall outside the circle.
const tilesWithinDistance = (cx, cy, radius) => {
  const tiles = [];
  for (let x = cx - radius; x <= cx + radius; x++) {
    for (let y = cy - radius; y <= cy + radius; y++) {
      if (distance(x, y, cx, cy) <= radius) tiles.push({ x, y });
    }
  }
  return tiles;
};

exports.DEFAULT_DISTANCE = DEFAULT_DISTANCE;
exports.distance = distance;
exports.randomIntFromInterval = randomIntFromInterval;
exports.checkConfiguration = checkConfiguration;
exports.resolveDistance = resolveDistance;
exports.resolveScanCenter = resolveScanCenter;
exports.tilesWithinDistance = tilesWithinDistance;
exports.isEmpty = isEmpty;
