var webpack    = require('webpack')
module.exports = {
  entry    : './dist/export',
  output   : {
    filename: 'dist/browser.min.js',
    library : 'S2'
  },
  externals: {
    "decimal.js": "Decimal",
    "long"      : "dcodeIO.Long"
  },
  resolve  : {},
  plugins  : [
    new webpack.optimize.UglifyJsPlugin({
      output  : {
        comments: false
      },
      mangle  : {
        props: {
          regex: /(LOOKUP)/
        }
      },
      compress: {
        warnings: false,

      }
    })
  ]
};