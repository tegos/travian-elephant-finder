const fs = require('node:fs');

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

const isRetryable = (err) => !err.response || err.response.status >= 500;

const withRetry = async (fn, retries = 3) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === retries || !isRetryable(err)) throw err;
      const wait = attempt * 2000;
      console.warn(
        `\nRequest failed (attempt ${attempt}/${retries}), retrying in ${wait / 1000}s...`,
      );
      await delay(wait);
    }
  }
};

module.exports = { delay, readJson, writeJson, withRetry };
