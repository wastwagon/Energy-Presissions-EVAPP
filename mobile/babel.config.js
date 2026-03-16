module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    'react-native-reanimated/plugin',
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
        alias: {
          '@screens': './src/screens',
          '@components': './src/components',
          '@services': './src/services',
          '@navigation': './src/navigation',
          '@store': './src/store',
          '@hooks': './src/hooks',
          '@utils': './src/utils',
          '@types': './src/types',
          '@assets': './assets',
          'shared': '../shared',
        },
      },
    ],
  ],
};
