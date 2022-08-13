const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

module.exports = {
  mode: 'development',
  entry: {
    main: "./src/main.js",
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname,  "dist"),
  },
  devServer: {
        port: 8081
  },
  plugins: [
        new HtmlWebpackPlugin({
            template: "index.html",
            chunks: ["main"]
        })
    ],
  performance: {
    hints: false,
    maxEntrypointSize: 5120000,
    maxAssetSize: 5120000
  }
};