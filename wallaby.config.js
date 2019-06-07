module.exports = (wallaby) => {
  return {
    files: [
      'src/**/*.js',
      '!src/**/__tests__/*-test.js'
    ],

    tests: [
      'src/**/__tests__/*-test.js'
    ],

    compilers: {
      '**/*.js': wallaby.compilers.babel()
    },

    env: {
      type: 'browser',
      kind: 'chrome'
    }
  }
}
