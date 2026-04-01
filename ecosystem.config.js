module.exports = {
  apps: [
    {
      name: "backend",
      script: "server.js",
      env: {
        PORT: 3000
      }
    },
    {
      name: "cache",
      script: "cache-server.js",
      env: {
        PORT: 4000
      }
    }
  ]
};


