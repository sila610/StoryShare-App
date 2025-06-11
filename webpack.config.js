const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  const isDevelopment = !isProduction;

  // Plugins array
  const plugins = [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, './public/index.html'),
      inject: 'body',
    }),

    new MiniCssExtractPlugin({
      filename: 'styles/[name].[contenthash].css',
    }),

    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, 'public/app.webmanifest'),
          to: 'app.webmanifest',
        },
        {
          from: path.resolve(__dirname, 'public/assets'),
          to: 'assets',
        },
        {
          from: path.resolve(__dirname, 'public/screenshots'),
          to: 'screenshots',
        },
        // Salin index.js ke dist
        {
          from: path.resolve(__dirname, 'public/index.js'),
          to: 'index.js',
        },
        // Salin styles.css dari src/styles ke dist
        {
          from: path.resolve(__dirname, 'src/styles/styles.css'),
          to: 'styles.css',
        },
        // Salin sw.js langsung ke dist
        {
          from: path.resolve(__dirname, 'sw.js'),
          to: 'sw.js',
        },
        // Salin offline.html ke dist
        {
          from: path.resolve(__dirname, 'public/offline.html'),
          to: 'offline.html',
        },
      ],
    }),
  ];

  return {
    entry: {
      app: path.resolve(__dirname, './public/index.js'),
    },
    output: {
      filename: '[name].bundle.js',
      path: path.resolve(__dirname, 'dist'),
      clean: true,
    },
    module: {
      rules: [
        {
          test: /\.css$/,
          use: [MiniCssExtractPlugin.loader, 'css-loader'],
        },
        {
          test: /\.(png|svg|jpg|jpeg|gif)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'assets/[name][ext]',
          },
        },
      ],
    },
    plugins,
    resolve: {
      extensions: ['.js'],
      alias: {
        utils: path.resolve(__dirname, 'src/utils/'),
        src: path.resolve(__dirname, 'src/'),
      },
    },
    devServer: {
      static: [
        {
          directory: path.join(__dirname, 'dist'),
        },
        {
          directory: path.join(__dirname, 'src/styles'),
          publicPath: '/styles',
        },
        {
          directory: path.join(__dirname, 'public'),
          publicPath: '/',
        },
      ],
      open: true,
      hot: true,
      port: 9003,
      // Tambahkan konfigurasi untuk service worker
      devMiddleware: {
        writeToDisk: true, // Tulis file ke disk agar service worker dapat mengaksesnya
      },
    },
    mode: isProduction ? 'production' : 'development',
    devtool: isProduction ? 'source-map' : 'eval-source-map',
    target: 'web',
  };
};
