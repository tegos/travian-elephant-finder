const cheerio = require('cheerio');
const cliProgress = require('cli-progress');
const config = require('#src/config/index.js');
const util = require('#src/services/util.js');
const auth = require('#src/services/auth.js');
const travian = require('#src/services/travian.js');
const { delay, readJson, writeJson, withRetry } = require('#src/libs/helpers.js');

const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

process.on('SIGINT', () => {
  bar.stop();
  process.exit(0);
});

async function main() {
  util.checkConfiguration();

  try {
    await auth.ensureAuthenticated();
  } catch (error) {
    console.error(`Login failed: ${error.message}`);
    process.exit(1);
  }

  const oasisPosition = readJson(config.jsonFile.oasis);

  const center = await util.resolveScanCenter();
  const distance = util.resolveDistance();
  console.log(
    `Scan center: (${center.x}, ${center.y})${center.auto ? ' (auto-detected from active village)' : ''} · distance: ${distance}`,
  );

  let villageSet = new Set();
  try {
    villageSet = await travian.fetchVillageCoordinates();
    console.log(`Loaded ${villageSet.size} village tiles from map.sql to skip`);
  } catch (error) {
    console.warn(`map.sql unavailable, scanning without village skip: ${error.message}`);
  }

  const tiles = util
    .tilesWithinDistance(center.x, center.y, distance)
    .filter(({ x, y }) => !villageSet.has(`${x},${y}`));

  const avgDelay = (config.delay.min + config.delay.max) / 2;
  const etaMinutes = Math.ceil((tiles.length * avgDelay) / 60000);
  console.log(`Scanning ${tiles.length} tiles (~${etaMinutes} min at current delay)`);

  bar.start(tiles.length, 0);

  for (const { x, y } of tiles) {
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
      // Tiles past the world boundary return HTTP 400 ("invalid values"). Villages
      // near the map edge push a wide-DISTANCE circle off-map, so skip those tiles
      // instead of aborting the whole scan.
      if (err?.response?.status !== 400) {
        bar.stop();
        console.error(err);
        process.exit(1);
      }
    }

    bar.increment();
    await delay(util.randomIntFromInterval(config.delay.min, config.delay.max));
  }

  bar.stop();
}

main();
