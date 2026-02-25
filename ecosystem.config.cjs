module.exports = {
  apps: [
    {
      name: 'tierra-esperanza',
      script: 'node_modules/.bin/tsx',
      args: 'server/index.ts',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    }
  ]
};
