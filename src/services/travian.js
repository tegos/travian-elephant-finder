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
