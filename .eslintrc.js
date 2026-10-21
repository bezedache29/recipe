module.exports = {
  root: true,
  extends: '@react-native',
  rules: {
    // React Navigation's headerRight/headerLeft are render functions, not components.
    'react/no-unstable-nested-components': ['warn', { allowAsProps: true }],
  },
};
