const cheerio = require('cheerio');
const axiosDefaultInstance = require('#src/libs/axiosDefault');
const config = require('#src/config');

const Auth = function Auth() {
  this.isCookieCorrect = async function isCookieCorrect() {
    try {
      const url = `${config.travian.server}/dorf1.php`;
      const response = await axiosDefaultInstance.get(url);
      const bodyString = response.data;

      return !bodyString.includes('action="/login.php"');
    } catch (error) {
      return false;
    }
  };

  this.refreshToken = async function refreshToken() {
    if (!(await this.isCookieCorrect())) {
      console.error('You had provided bad cookies');
      process.exit();
    }

    try {
      const url = `${config.travian.server}/dorf1.php`;
      const response = await axiosDefaultInstance.get(url);
      const bodyString = response.data;

      const $ = cheerio.load(bodyString);

      const scriptNode = $('head > script')
        .map((i, x) => x.children[0])
        .filter((i, x) => x && x.data.match(/eval/))
        .get(0);

      if (scriptNode) {
        const lines = scriptNode.data.split('\n');
        let atobStringFull = '';
        let token = '';

        lines.forEach((line) => {
          if (line.includes('eval')) {
            atobStringFull = line;
          }
        });

        const regExp = /\(([^)]+)\)/;
        const matches = regExp.exec(atobStringFull);

        let atobString = matches[1];
        atobString = atobString.replace(/'/g, '')
          .replace('atob(', '');

        const tokenInit = Buffer.from(atobString, 'base64')
          .toString('binary');

        const parts = tokenInit.split('&&');
        token = parts[1].replace(/'/g, '')
          .trim();

        config.setToken(token);
      }
    } catch (error) {
      console.error(error);
    }
  };
};

module.exports = new Auth();
