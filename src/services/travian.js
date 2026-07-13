const cheerio = require('cheerio');
const axiosApiInstance = require('#src/libs/axiosApi.js');
const axiosDefaultInstance = require('#src/libs/axiosDefault.js');
const config = require('#src/config/index.js');

const Travian = function Travian() {
  this.animals = {
    Rats: 'u31',
    Spiders: 'u32',
    Snakes: 'u33',
    Bats: 'u34',
    Bears: 'u37',
    Crocodiles: 'u38',
    Tigers: 'u39',
    Elephants: 'u40',
  };

  this.getApiUrl = function viewTileDetails() {
    return `${config.travian.server}/api/v1`;
  };

  this.viewTileDetails = function viewTileDetails(x, y) {
    const sendData = {
      x,
      y,
    };

    return axiosApiInstance.post(`${this.getApiUrl()}/map/tile-details`, sendData);
  };

  // Parses the active village coordinates out of a dorf1.php page. Travian renders the
  // minus sign as the Unicode "−" (U+2212), so normalize it to ASCII "-" before parsing.
  // Pure parser, split out for testing.
  this.parseOwnCoordinates = function parseOwnCoordinates(html) {
    const $ = cheerio.load(html);
    const read = (selector) => {
      const raw = $(selector).first().text();
      const normalized = raw.replace(/−/g, '-').replace(/[^0-9-]/g, '');
      return normalized === '' || normalized === '-' ? null : parseInt(normalized, 10);
    };

    const x = read('.coordinateX');
    const y = read('.coordinateY');
    if (x === null || y === null) return null;
    return { x, y };
  };

  // Fetches the active village coordinates (the one dorf1.php opens by default).
  this.fetchOwnCoordinates = async function fetchOwnCoordinates() {
    const response = await axiosApiInstance.get(`${config.travian.server}/dorf1.php`);
    return this.parseOwnCoordinates(response.data);
  };

  this.getMapSqlUrl = function getMapSqlUrl() {
    return `${config.travian.server}/map.sql`;
  };

  // map.sql lists only occupied villages (no oasis/empty tiles). A village tile is
  // never an oasis, so its coordinates can be skipped during the oasis grid scan.
  // Pure parser, split out for testing.
  this.parseVillageCoordinates = function parseVillageCoordinates(sql) {
    const pattern = /INSERT INTO `x_world` VALUES \(\d+,(-?\d+),(-?\d+),/g;
    const coordinates = new Set();
    for (const match of String(sql).matchAll(pattern)) {
      coordinates.add(`${match[1]},${match[2]}`);
    }
    return coordinates;
  };

  this.fetchVillageCoordinates = async function fetchVillageCoordinates() {
    const response = await axiosDefaultInstance.get(this.getMapSqlUrl(), {
      timeout: 30000,
      responseType: 'text',
    });
    return this.parseVillageCoordinates(response.data);
  };
};

module.exports = new Travian();
