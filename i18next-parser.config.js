module.exports = {
  locales: ['en', 'zh-CN', 'zh-TW'],
  output: 'locales/$LOCALE/translation.json',
  input: ['src/**/*.{js,jsx,ts,tsx}'],
  defaultValue: '',
  useKeysAsDefaultValue: true,
};