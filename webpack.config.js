const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { InjectManifest } = require('workbox-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  return {
    entry: {
      app: path.resolve(__dirname, 'src/index.js'),  // Pastikan path ke index.js benar
    },

    output: {
      path: path.resolve(__dirname, 'dist'),  // Tempatkan hasil build di folder dist
      filename: isProduction ? '[name].[contenthash].bundle.js' : '[name].bundle.js',
      clean: true,
    },

    resolve: {
      alias: {
        utils: path.resolve(__dirname, 'src/utils/'),  // Alias untuk `utils`
      },
      extensions: ['.js', '.json', '.wasm', '.css'],
    },
    
    module: {
      rules: [
        {
          test: /\.css$/i,
          use: [
            isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
            'css-loader',
          ],
        },
        {
          test: /\.(png|jpe?g|gif|svg)$/i,
          type: 'asset/resource',
        },
      ],
    },

    plugins: [
      new HtmlWebpackPlugin({
        template: path.resolve(__dirname, 'src/index.html'),
        inject: 'body',
      }),

      isProduction && new InjectManifest({
        swSrc: path.resolve(__dirname, 'src/sw.js'),
        swDest: 'sw.bundle.js',
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
        ],
      }),
    ],

    optimization: {
      splitChunks: {
        chunks: 'all',
      },
    },

    devServer: {
      static: [
        {
          directory: path.join(__dirname, 'dist'),
        },
        {
          directory: path.join(__dirname, 'src/styles'),
          publicPath: '/src/styles',
        },
        {
          directory: path.join(__dirname, 'public'),
          publicPath: '/',
        },
      ],
      open: true,
      hot: true,
      port: 9000,
    },

    mode: isProduction ? 'production' : 'development',
    devtool: isProduction ? 'source-map' : 'eval-source-map',
    target: 'web',
  };
};
