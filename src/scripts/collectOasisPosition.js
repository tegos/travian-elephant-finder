const cheerio = require('cheerio');
const cliProgress = require('cli-progress');
const config = require('#src/config/index.js');
const util = require('#src/services/util.js');
const travian = require('#src/services/travian.js');
const { delay, readJson, writeJson, withRetry } = require('#src/libs/helpers.js');

const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

process.on('SIGINT', () => {
  bar.stop();
  process.exit(0);
});

async function main() {
  util.checkConfiguration();

  const oasisPosition = readJson(config.jsonFile.oasis);

  const startX = Math.min(+config.coordinates.minX, +config.coordinates.maxX);
  const endX = Math.max(+config.coordinates.minX, +config.coordinates.maxX);
  const startY = Math.min(+config.coordinates.minY, +config.coordinates.maxY);
  const endY = Math.max(+config.coordinates.minY, +config.coordinates.maxY);

  const totalFields = (endX - startX) * (endY - startY);
  bar.start(totalFields, 0);

  for (let x = startX; x < endX; x++) {
    for (let y = startY; y < endY; y++) {
      try {
        const response = await withRetry(() => travian.viewTileDetails(x, y));
        const { html } = response.data;
        const $ = cheerio.load(html);

        const tileDetails = $('#tileDetails');
        const className = tileDetails.attr('class');
        if (className.includes('oasis')) {
          oasisPosition.push({ x, y });
          writeJson(config.jsonFile.oasis, oasisPosition);
        }
      } catch (err) {
        bar.stop();
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
