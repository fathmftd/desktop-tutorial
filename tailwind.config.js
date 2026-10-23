/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html'],
  // Kelas yang dibentuk dinamis oleh flashIndicator()
  safelist: [{ pattern: /bg-(red|yellow|orange|green)-500\/20/ }],
  theme: { extend: {} },
  plugins: [],
};
