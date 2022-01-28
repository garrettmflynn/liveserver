const path = require('path')

var PATHS = {
  entryPoint: path.resolve(__dirname, './index.ts'),
  bundles: path.resolve(__dirname, 'dist'),
}

var config = {
  entry: {
    'index': [PATHS.entryPoint],
    'index.min': [PATHS.entryPoint]
  },
  // externals: [/node_modules/, 'bufferutil', 'utf-8-validate'],
  output: {
    path: PATHS.bundles,
    filename: '[name].js',
    library: {
      type: 'umd',
      // type: 'module',
      name: 'liveserver',
      // export: 'default',
      // umdNamedDefine: true,
    },
    globalObject: 'this',
    publicPath: '',
  },
  externals: {
    bufferutil: "bufferutil",
    "utf-8-validate": "utf-8-validate",
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
    fallback: {
      http: false,
      https: false,
      crypto:false,
      stream: require.resolve("stream-browserify"),
      zlib:false,
      tls:false,
      url:false,
      net:false,
    },
  },
  optimization: {
    minimize: false,
  },
  devtool: 'source-map',
  module: {
    rules: [
        { test: /\.tsx?$/, loader: "ts-loader" },
        {
          test: /\.m?js$/,
          exclude: /(node_modules|bower_components)/,
          use: {
            loader: 'babel-loader',
            // options: {
            //   presets: ['@babel/preset-env'],
            //   plugins: [ "transform-class-properties" ]
            // }
          }
        }
      ],
  },
  // plugins: [
  //   new WorkerPlugin()
  //  ]
}

module.exports = config;