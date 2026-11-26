const { getDefaultConfig } = require('expo/metro-config');
const { createPoseMiddleware } = require('./server/pose-middleware.cjs');

const config = getDefaultConfig(__dirname);
const poseMiddleware = createPoseMiddleware(__dirname);
const enhanceMiddleware = config.server.enhanceMiddleware;

config.server.enhanceMiddleware = (middleware, server) => {
  const metroMiddleware = enhanceMiddleware ? enhanceMiddleware(middleware, server) : middleware;
  return (request, response, next) => poseMiddleware(request, response, () => metroMiddleware(request, response, next));
};

config.resolver.blockList = [
  ...[config.resolver.blockList].flat().filter(Boolean),
  /[\\/]\.(?:npm-cache|tools|venv)(?:[\\/]|$)/,
];

module.exports = config;
