const fs = require('node:fs').promises;
const path = require('node:path');
const config = require('#src/config');

const directory = 'output';

async function main() {
  const files = await fs.readdir(directory);
  const toDelete = files.filter((item) => !/(^|\/)\.[^/.]/g.test(item));

  if (toDelete.length > 0) {
    await Promise.all(toDelete.map((file) => fs.unlink(path.join(directory, file))));
    console.log(`Removed: ${toDelete.join(', ')}`);
  }

  await fs.writeFile(config.jsonFile.oasis, '[]');
  await fs.writeFile(config.jsonFile.oasisOccupied, '[]');
  console.log('Output directory cleaned.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
