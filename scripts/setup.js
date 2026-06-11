const fs = require('node:fs');

const files = [
  ['.env.example', '.env'],
  ['src/config/cookie.txt.example', 'src/config/cookie.txt'],
  ['src/config/token.txt.example', 'src/config/token.txt'],
];

for (const [src, dst] of files) {
  if (fs.existsSync(dst)) {
    console.log(`skip   ${dst} (already exists)`);
  } else {
    fs.copyFileSync(src, dst);
    console.log(`create ${dst}`);
  }
}
