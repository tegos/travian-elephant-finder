const fs = require('node:fs');
const cheerio = require('cheerio');
const jsonfile = require('jsonfile');
const cliProgress = require('cli-progress');
const config = require('#src/config');
const util = require('#src/services/util');
const travian = require('#src/services/travian');

const delay = (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

process.on('SIGINT', () => {
  bar.stop();
  process.exit(0);
});

async function main() {
  util.checkConfiguration();

  let oasisPosition = [];
  if (fs.existsSync(config.jsonFile.oasis)) {
    oasisPosition = jsonfile.readFileSync(config.jsonFile.oasis);
    if (!Array.isArray(oasisPosition)) oasisPosition = [];
  }

  const startX = Math.min(+config.coordinates.minX, +config.coordinates.maxX);
  const endX = Math.max(+config.coordinates.minX, +config.coordinates.maxX);
  const startY = Math.min(+config.coordinates.minY, +config.coordinates.maxY);
  const endY = Math.max(+config.coordinates.minY, +config.coordinates.maxY);

  const totalFields = (endX - startX) * (endY - startY);
  bar.start(totalFields, 0);

  for (let x = startX; x < endX; x++) {
    for (let y = startY; y < endY; y++) {
      try {
        const response = await travian.viewTileDetails(x, y);
        const { html } = response.data;
        const $ = cheerio.load(html);

        const tileDetails = $('#tileDetails');
        const className = tileDetails.attr('class');
        if (className.includes('oasis')) {
          oasisPosition.push({ x, y });
          jsonfile.writeFileSync(config.jsonFile.oasis, oasisPosition);
        }
      } catch (err) {
        console.error(err);
        process.exit(1);
      }

      bar.increment();
      await delay(util.randomIntFromInterval(config.delay.min, config.delay.max));
    }
  }

  bar.stop();
}

main();
