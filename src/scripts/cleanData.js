const fs = require('fs');
const path = require('path');
const jsonfile = require('jsonfile');
const config = require('~src/config');

const directory = 'data';

fs.readdir(directory, (readErr, files) => {
  if (readErr) throw readErr;

  const filterFiles = files.filter((item) => !(/(^|\/)\.[^/.]/g).test(item));

  filterFiles.forEach((file) => {
    fs.unlink(path.join(directory, file), (err) => {
      if (err) throw err;
    });
  });

  jsonfile.writeFileSync(config.jsonFile.oasis, []);
  jsonfile.writeFileSync(config.jsonFile.oasisOccupied, []);

  console.log(`Directory ${directory} cleaned`);
});
