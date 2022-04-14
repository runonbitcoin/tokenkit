/**
 * Module to store global tokenkit state.
 */

// Private state
const state = {
  run: null
}

// Public state api
export default {
  get run() {
    if (!state.run) {
      throw new Error('No RUN instance. Set with `tokenkit.init(run)`.')
    }

    return state.run
  },

  set run($run) {
    state.run = $run
  }
}