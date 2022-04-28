import path from 'path'

const tokenkitPath = process.env.LIB ?
  process.env.LIB :
  'src/index.js';

const tokenkit = await import(path.join(process.cwd(), tokenkitPath))

export default tokenkit

