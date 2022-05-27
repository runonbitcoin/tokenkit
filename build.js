import esbuild from 'esbuild'
import GlobalsPlugin from 'esbuild-plugin-globals'

esbuild.build({
  entryPoints: ['src/index.js'],
  outfile: 'dist/tokenkit.min.js',
  globalName: 'tokenkit',
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: 'es6',
  minify: true,
  keepNames: true,
  sourcemap: true,
  define: {
    VARIANT: 'browser'
  },
  plugins: [
    GlobalsPlugin({
      'crypto': '{}',
      'run-sdk': 'Run',
      '@runonbitcoin/nimble': 'nimble'
    })
  ]
})

const makeAllPackagesExternalPlugin = {
  name: 'make-all-packages-external',
  setup(build) {
    let filter = /^[^.\/]|^\.[^.\/]|^\.\.[^\/]/ // Must not start with "/" or "./" or "../"
    build.onResolve({ filter }, args => ({ path: args.path, external: true }))
  },
}

esbuild.build({
  entryPoints: ['src/index.js'],
  outfile: 'dist/tokenkit.cjs',
  bundle: true,
  format: 'cjs',
  platform: 'node',
  target: 'node10',
  keepNames: true,
  define: {
    VARIANT: 'node'
  },
  plugins: [
    makeAllPackagesExternalPlugin
  ]
})

esbuild.build({
  entryPoints: ['src/index.js'],
  outfile: 'dist/tokenkit.mjs',
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node12',
  keepNames: true,
  define: {
    VARIANT: 'node'
  },
  plugins: [
    makeAllPackagesExternalPlugin
  ]
})

esbuild.build({
  entryPoints: ['test/browser.bundle.js'],
  outfile: 'dist/tokenkit.tests.js',
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: 'es6',
  keepNames: true,
  define: {
    VARIANT: 'browser'
  },
  plugins: [
    GlobalsPlugin({
      'crypto': '{}',
      'run-sdk': 'Run',
      '@runonbitcoin/nimble': 'nimble',
      'mocha': 'mocha.Mocha',
      'chai': 'chai',
      '../env/tokenkit.js': 'tokenkit'
    })
  ]
})
