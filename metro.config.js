const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

config.resolver.blockList = [
  /.*\/\.local\/skills\/\.tmp-.*/,
  /.*\/\.local\/skills\/\.old-.*/,
  /.*\/\.local\/secondary_skills\/\.tmp-.*/,
  /.*\/\.local\/secondary_skills\/\.old-.*/,
];

module.exports = config;
