const path = require('path');

module.exports = {
  // Other configuration options...
  resolve: {
    fallback: {
      "fs": require.resolve("fs"),
      "path": require.resolve("path-browserify"),
    },
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-react'],
          },
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
};