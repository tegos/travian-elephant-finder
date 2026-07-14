const fs = require('node:fs');
const cheerio = require('cheerio');
const cliProgress = require('cli-progress');
const config = require('#src/config/index.js');
const util = require('#src/services/util.js');
const auth = require('#src/services/auth.js');
const travian = require('#src/services/travian.js');
const { delay, readJson, writeJson, withRetry } = require('#src/libs/helpers.js');
const animalIcons = require('#src/config/animalIcons.js');

// One oasis row: coordinates link, elephant count, the full guard list on a single
// line (icon + count per animal), and the distance from the scan center in fields.
const guardsCell = (troops) =>
  troops
    .map(
      (t) =>
        `<span class="guard${t.u === 'u40' ? ' guard-elephant' : ''}">${
          animalIcons[t.u]
            ? `<img src="${animalIcons[t.u]}" alt="${t.name}" title="${t.name}"/>`
            : ''
        }${t.n}</span>`,
    )
    .join('');

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
    td { padding: 0.6rem 1rem; border-bottom: 1px solid #1e293b; vertical-align: middle; }
    tr:hover td { background: #1e293b; }
    .num { text-align: right; font-variant-numeric: tabular-nums; }
    .coord { color: #38bdf8; text-decoration: none; font-weight: 600; font-variant-numeric: tabular-nums; }
    .coord:hover { text-decoration: underline; }
    .elephants { color: #f97316; font-weight: 800; text-align: right; font-variant-numeric: tabular-nums; }
    .guards { display: flex; flex-wrap: wrap; gap: 0.3rem 0.7rem; }
    .guard { display: inline-flex; align-items: center; gap: 0.25rem; color: #cbd5e1; white-space: nowrap; }
    .guard img { width: 26px; height: 26px; object-fit: contain; }
    .guard-elephant { color: #f97316; font-weight: 700; }
  </style>
</head>
<body>
  <h1>🐘 Travian Elephants</h1>
  <p class="meta">${server ? `Server: ${server} &nbsp;·&nbsp; ` : ''}Found: ${rows.length} oases &nbsp;·&nbsp; Generated: ${new Date().toLocaleString()}</p>
  <table id="t">
    <thead>
      <tr>
        <th data-col="0">Oasis</th>
        <th data-col="1">Elephants</th>
        <th data-col="2">Guards</th>
        <th data-col="3">Distance</th>
      </tr>
    </thead>
    <tbody>
      ${rows
        .map(
          (r) =>
            `<tr>
        <td data-sort="${r.distance}"><a class="coord" href="${server}/karte.php?x=${r.x}&amp;y=${r.y}" target="_blank" rel="noopener">(${r.x}|${r.y})</a></td>
        <td class="elephants" data-sort="${r.elephants}">${r.elephants}</td>
        <td data-sort="${r.total}"><div class="guards">${guardsCell(r.troops)}</div></td>
        <td class="num" data-sort="${r.distance}">${r.distance.toFixed(2)} fields</td>
      </tr>`,
        )
        .join('\n      ')}
    </tbody>
  </table>
  <script>
    const t = document.getElementById('t');
    let sortCol = 1, sortDir = -1;
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
        const v = (r) => { const c = r.cells[col]; const s = c.dataset.sort; return s !== undefined ? parseFloat(s) : c.textContent; };
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

const CSV_HEADER = 'x,y,distance,elephants,totalAnimals,guards\n';

async function main() {
  util.checkConfiguration();

  try {
    await auth.ensureAuthenticated();
  } catch (error) {
    console.error(`Login failed: ${error.message}`);
    process.exit(1);
  }

  const center = await util.resolveScanCenter();
  console.log(
    `Sorting by distance from (${center.x}, ${center.y})${center.auto ? ' (auto-detected from active village)' : ''}`,
  );

  let oasisPositions = readJson(config.jsonFile.oasis);
  const oasisPositionsOccupiedArray = readJson(config.jsonFile.oasisOccupied);

  const posKey = (p) => `${p.x},${p.y}`;
  const occupiedSet = new Set(oasisPositionsOccupiedArray.map(posKey));

  oasisPositions = oasisPositions.filter((position) => !occupiedSet.has(posKey(position)));

  oasisPositions.forEach((obj) => {
    const rObj = obj;
    rObj.distance = util.distance(obj.x, obj.y, center.x, center.y);
  });

  oasisPositions.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));

  const date = new Date();
  const isoDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const fileNameAdd = `${isoDate}_${date.getTime()}`;
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

      // Parse the full guard list once: each row is one animal type (icon class + count + name).
      const troops = [];
      let elephants = 0;
      let totalAnimal = 0;
      table.find('tr').each((_i, tr) => {
        const cls = ($(tr).find('img.unit').first().attr('class') || '')
          .split(/\s+/)
          .find((c) => /^u\d+$/.test(c));
        const n = parseInt($(tr).find('.val').text(), 10);
        const name = $(tr).find('.desc').text().trim();
        if (!cls || !Number.isFinite(n)) return;
        troops.push({ u: cls, n, name });
        totalAnimal += n;
        if (cls === travian.animals.Elephants) elephants = n;
      });

      if (elephants > 0) {
        const { distance } = oasisPositions[pos];
        const guardSummary = troops.map((t) => `${t.n} ${t.name}`).join('; ');
        const row = `${x},${y},${distance.toFixed(2)},${elephants},${totalAnimal},"${guardSummary}"\n`;
        fs.appendFileSync(csvFile, row);

        results.push({ x, y, distance, elephants, total: totalAnimal, troops });
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
