const fs = require('node:fs');
const cheerio = require('cheerio');
const cliProgress = require('cli-progress');
const config = require('#src/config');
const util = require('#src/services/util');
const travian = require('#src/services/travian');
const { delay, readJson, writeJson, withRetry } = require('#src/libs/helpers');

const buildHtml = (rows, server) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Travian Elephants</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, sans-serif; background: #0f172a; color: #e2e8f0; padding: 2rem; }
    h1 { font-size: 1.5rem; margin-bottom: 0.25rem; }
    .meta { color: #94a3b8; font-size: 0.875rem; margin-bottom: 1.5rem; }
    table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
    th { background: #1e293b; color: #94a3b8; font-weight: 600; text-transform: uppercase;
         font-size: 0.75rem; letter-spacing: 0.05em; padding: 0.75rem 1rem;
         text-align: left; cursor: pointer; user-select: none; white-space: nowrap; }
    th:hover { color: #e2e8f0; }
    th.asc::after  { content: ' ↑'; }
    th.desc::after { content: ' ↓'; }
    td { padding: 0.6rem 1rem; border-bottom: 1px solid #1e293b; }
    tr:hover td { background: #1e293b; }
    .num { text-align: right; font-variant-numeric: tabular-nums; }
    .elephant { color: #f97316; font-weight: 700; }
  </style>
</head>
<body>
  <h1>🐘 Travian Elephants</h1>
  <p class="meta">${server ? `Server: ${server} &nbsp;·&nbsp; ` : ''}Found: ${rows.length} oases &nbsp;·&nbsp; Generated: ${new Date().toLocaleString()}</p>
  <table id="t">
    <thead>
      <tr>
        <th data-col="0">x</th>
        <th data-col="1">y</th>
        <th data-col="2">Elephants</th>
        <th data-col="3">Other animals</th>
        <th data-col="4">Crocodiles</th>
        <th data-col="5">Tigers</th>
        <th data-col="6">Total animals</th>
      </tr>
    </thead>
    <tbody>
      ${rows
        .map(
          (r) =>
            `<tr>
        <td class="num">${r.x}</td>
        <td class="num">${r.y}</td>
        <td class="num elephant">${r.elephants}</td>
        <td class="num">${r.other}</td>
        <td class="num">${r.crocs}</td>
        <td class="num">${r.tigers}</td>
        <td class="num">${r.total}</td>
      </tr>`,
        )
        .join('\n      ')}
    </tbody>
  </table>
  <script>
    const t = document.getElementById('t');
    let sortCol = 2, sortDir = -1;
    t.querySelector('thead').addEventListener('click', (e) => {
      const th = e.target.closest('th');
      if (!th) return;
      const col = +th.dataset.col;
      sortDir = col === sortCol ? -sortDir : -1;
      sortCol = col;
      t.querySelectorAll('th').forEach(h => h.classList.remove('asc','desc'));
      th.classList.add(sortDir === -1 ? 'desc' : 'asc');
      const rows = [...t.querySelectorAll('tbody tr')];
      rows.sort((a, b) => {
        const v = (r) => +r.cells[col].textContent;
        return sortDir * (v(b) - v(a));
      });
      rows.forEach(r => t.querySelector('tbody').appendChild(r));
    });
  </script>
</body>
</html>`;

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
  const csvFile = `output/elephant_${fileNameAdd}.csv`;
  const htmlFile = `output/elephant_${fileNameAdd}.html`;
  fs.mkdirSync('output', { recursive: true });
  fs.writeFileSync(csvFile, CSV_HEADER);

  const results = [];

  bar.start(oasisPositions.length, 0);

  for (let pos = 0; pos < oasisPositions.length; pos++) {
    const { x, y } = oasisPositions[pos];

    try {
      const r = await withRetry(() => travian.viewTileDetails(x, y));
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
        fs.appendFileSync(csvFile, row);

        results.push({
          x,
          y,
          elephants: amount,
          other: anotherAnimal,
          crocs: hasCrocodile.length,
          tigers: hasTiger.length,
          total: totalAnimal,
        });
        fs.writeFileSync(htmlFile, buildHtml(results, config.travian.server));
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
      bar.stop();
      console.error(err);
      process.exit(1);
    }

    bar.increment();
    await delay(util.randomIntFromInterval(config.delay.min, config.delay.max));
  }

  bar.stop();
  console.log(`${oasisPositions.length} oases processed — ${results.length} with elephants`);
  if (results.length > 0) {
    console.log(`Results: ${csvFile}`);
    console.log(`Report:  ${htmlFile}`);
  }
}

main();
