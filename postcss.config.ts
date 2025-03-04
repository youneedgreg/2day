module.exports = {
  plugins: [
    require('tailwindcss'),
    require('autoprefixer'),
  ],
  // Optional: configure source maps
  ...(process.env.NODE_ENV === 'development' ? { devtool: 'source-map' } : {}),
};