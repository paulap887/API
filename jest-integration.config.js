const baseConfig = require('./jest.config');

module.exports = {
  ...baseConfig,
  testRegex: '.integration.spec.ts$',
  testPathIgnorePatterns: ['/node_modules/'],
};
