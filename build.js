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
  plugins: [
    GlobalsPlugin({
      'run-sdk': 'Run'
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
  plugins: [
    makeAllPackagesExternalPlugin
  ]
})