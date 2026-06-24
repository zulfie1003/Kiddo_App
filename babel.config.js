module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          alias: {
            '@': './src',
            '@components': './src/components',
            '@engine': './src/engine',
            '@store': './src/store',
            '@types': './src/types',
            '@hooks': './src/hooks',
            '@utils': './src/utils',
            '@mocks': './src/mocks',
            '@screens': './src/screens',
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
