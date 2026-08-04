const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver.blockList = [
  new RegExp(path.join(__dirname, 'gcp-functions').replace(/\\/g, '\\\\')),
];

module.exports = config;