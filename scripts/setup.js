const fs = require('node:fs');

const files = [['.env.example', '.env']];

for (const [src, dst] of files) {
  if (fs.existsSync(dst)) {
    console.log(`skip   ${dst} (already exists)`);
  } else {
    fs.copyFileSync(src, dst);
    console.log(`create ${dst}`);
  }
}
