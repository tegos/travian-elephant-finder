const fs = require('node:fs');
const cheerio = require('cheerio');
const cliProgress = require('cli-progress');
const config = require('#src/config');
const util = require('#src/services/util');
const travian = require('#src/services/travian');

const delay = (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const readJson = (filePath) => {
  if (!fs.existsSync(filePath)) return [];
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

const writeJson = (filePath, data) => fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

process.on('SIGINT', () => {
  bar.stop();
  process.exit(0);
});

const CSV_HEADER = 'x,y,Elephant,Another animal,hasCrocodile,hasTiger,totalAnimal\n';

async function main() {
  util.checkConfiguration();

  let oasisPositions = readJson(config.jsonFile.oasis);
  const oasisPositionsOccupiedArray = readJson(config.jsonFile.oasisOccupied);

  const posKey = (p) => `${p.x},${p.y}`;
  const occupiedSet = new Set(oasisPositionsOccupiedArray.map(posKey));

  oasisPositions = oasisPositions.filter((position) => !occupiedSet.has(posKey(position)));

  oasisPositions.forEach((obj) => {
    const rObj = obj;
    const { startX, startY } = config.coordinates;
    rObj.distance = util.distance(obj.x, obj.y, startX, startY);
  });

  oasisPositions.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));

  const date = new Date();
  const fileNameAdd = `${date.toLocaleDateString()}_${date.getTime()}`;
  const file = `data/elephant_${fileNameAdd}.csv`;
  fs.mkdirSync('data', { recursive: true });
  fs.writeFileSync(file, CSV_HEADER);

  bar.start(oasisPositions.length, 0);

  for (let pos = 0; pos < oasisPositions.length; pos++) {
    const { x, y } = oasisPositions[pos];

    try {
      const r = await travian.viewTileDetails(x, y);
      const html = r.data.html;
      const $ = cheerio.load(html);

      const table = $('#troop_info').first();
      const td = table.find(`img.${travian.animals.Elephants}`);
      const hasCrocodile = table.find(`img.${travian.animals.Crocodiles}`);
      const hasTiger = table.find(`img.${travian.animals.Tigers}`);
      const trCount = table.find('tr');

      let anotherAnimal = 0;
      let totalAnimal = 0;
      let amount = 0;

      if (td.length > 0) {
        anotherAnimal = trCount.length - 1;
        const tr = td.closest('tr');
        amount = parseInt(tr.find('.val').text(), 10);

        console.warn({ x, y });

        table.find('td.val').each(function valsEach() {
          totalAnimal += parseInt($(this).text(), 10);
        });
      }

      if (amount > 0) {
        const row = `${x},${y},${amount},${anotherAnimal},${hasCrocodile.length},${hasTiger.length},${totalAnimal}\n`;
        fs.appendFileSync(file, row);
      }

      const tileDetails = $('#tileDetails').first();
      if (tileDetails.hasClass('oasis-3')) {
        occupiedSet.add(posKey({ x, y }));
        writeJson(
          config.jsonFile.oasisOccupied,
          [...occupiedSet].map((k) => {
            const [px, py] = k.split(',');
            return { x: +px, y: +py };
          }),
        );
      }
    } catch (err) {
      console.error(err);
      process.exit(1);
    }

    bar.increment();
    await delay(util.randomIntFromInterval(config.delay.min, config.delay.max));
  }

  bar.stop();
  console.log(`${oasisPositions.length} oases processed`);
}

main();
