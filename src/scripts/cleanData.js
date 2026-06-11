const fs = require('node:fs').promises;
const path = require('node:path');
const config = require('#src/config');

const directory = 'data';

async function main() {
  const files = await fs.readdir(directory);
  const filterFiles = files.filter((item) => !/(^|\/)\.[^/.]/g.test(item));
  await Promise.all(filterFiles.map((file) => fs.unlink(path.join(directory, file))));
  await fs.writeFile(config.jsonFile.oasis, '[]');
  await fs.writeFile(config.jsonFile.oasisOccupied, '[]');
  console.log(`Directory ${directory} cleaned`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
