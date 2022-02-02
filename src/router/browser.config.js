const path = require('path')

var PATHS = {
  entryPoint: path.resolve(__dirname, './index.ts'),
  bundles: path.resolve(__dirname, './dist'),
}

var config = {
  entry: {
    'index': [PATHS.entryPoint],
    'index.min': [PATHS.entryPoint]
  },
  output: {
    path: PATHS.bundles,
    filename: '[name].js',
    library: {
      type: 'umd',
      // type: 'module',
      name: 'router',
      // export: 'default',
      // umdNamedDefine: true,
    },
    globalObject: 'this',
    publicPath: '',
  },
  // experiments: {
  //   outputModule: true,
  // },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
    fallback: {
      browser: false,
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
      url:false,
      dgram:false,
      net:false,
      child_process:false,
    },
  },
  optimization: {
    minimize: false,
  },
  devtool: 'source-map',
  module: {
    rules: [
        { 
          test: /\.(ts|js)x?$/,
          exclude: /(node_modules|bower_components|dist)/,
          use: [
            {
              loader: 'babel-loader',
              options: {
                cacheDirectory: true,
              },
            },
            {loader: 'ts-loader'}
          ]
        }
      ]
  },
  // plugins: [
  //   new WorkerPlugin()
  //  ]
}

module.exports = config;