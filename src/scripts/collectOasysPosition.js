const cheerio = require('cheerio');
const sleep = require('system-sleep');
const jsonfile = require('jsonfile');
const cliProgress = require('cli-progress');
const config = require('~src/config');
const util = require('~src/services/util');
const travian = require('~src/services/travian');

const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

let oasisPosition = jsonfile.readFileSync(config.jsonFile.oasis);

if (!Array.isArray(oasisPosition)) {
  oasisPosition = [];
}

util.checkConfiguration();

const startX = Math.min(+config.coordinates.minX, +config.coordinates.maxX);
const endX = Math.max(+config.coordinates.minX, +config.coordinates.maxX);

const startY = Math.min(+config.coordinates.minY, +config.coordinates.maxY);
const endY = Math.max(+config.coordinates.minY, +config.coordinates.maxY);

const totalFields = (endX - startX) * (endY - startY);
bar.start(totalFields, 0);

for (let x = startX; x < endX; x++) {
  for (let y = startY; y < endY; y++) {
    travian.viewTileDetails(x, y)
      .then((response) => {
        const responseData = response.data;
        const { html } = responseData;

        const $ = cheerio.load(html);

        const tileDetails = $('#tileDetails');
        const className = tileDetails.attr('class');
        if (className.includes('oasis')) {
          oasisPosition.push({
            x,
            y,
          });

          jsonfile.writeFileSync(config.jsonFile.oasis, oasisPosition);
        }

        bar.increment();
      })
      .catch((err) => {
        console.log(err);
        process.exit();
      });

    sleep(util.randomIntFromInterval(+config.delay.min, +config.delay.max));
  }
}

bar.stop();
