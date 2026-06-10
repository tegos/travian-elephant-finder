module.exports = {
  env: {
    browser: true,
    es6: true,
  },
  extends: [
    'airbnb-base',
  ],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  parserOptions: {
    ecmaVersion: 11,
  },
  settings: {
    'import/resolver': {
      alias: {
        map: [
          ['~src', './src'],
          ['~root', '.'],
        ],
        extensions: ['.js'],
      },
    },
  },
  rules: {
    'no-console': 'off',
    'no-loop-func': 'off',
    'no-plusplus': [2, { allowForLoopAfterthoughts: true }],
  },
};
