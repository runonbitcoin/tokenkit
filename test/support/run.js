import fs from 'fs'
import Run from 'run-sdk'

const jsonPath = new URL('./state.orderlock.json', import.meta.url).pathname
const json = JSON.parse(fs.readFileSync(jsonPath))

export const run = new Run({ network: 'mock', trust: 'state' })

export async function preCacheState(state) {
  for (const key of Object.keys(state)) {
    const cached = await run.cache.get(key)
    if (!cached) {
      await run.cache.set(key, state[key])
    }
  }
}

before(async () => {
  await preCacheState(json)
})

//export async function preCacheCode() {
//  await preCacheState(json)
//}