// eslint-disable-next-line
module.exports = function (context, options) {
    return {
      name: 'webpack-plugin',
      // eslint-disable-next-line
      configureWebpack(config, isServer, utils) {
        return {
          resolve: {
            fallback: {
              buffer: false,
              fs: false,
              http: false,
              https: false,
              os: false,
              util: false,
              path:false,
              crypto:false,
              stream: false,
              zlib:false,
              dns:false,
              tls:false,
              dgram:false,
              net:false,
              child_process:false,
            },
          },
        };
      },
    };
  };