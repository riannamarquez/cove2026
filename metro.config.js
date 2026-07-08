const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.blockList = [
  new RegExp(`gcp-functions`),
];

module.exports = config;