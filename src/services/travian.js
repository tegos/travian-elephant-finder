const axiosApiInstance = require('#src/libs/axiosApi.js');
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
};

module.exports = new Travian();
