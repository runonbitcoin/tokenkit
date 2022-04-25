/**
 * Module to fetch global Run instance.
 */

import Run from 'run-sdk'

// Public state api
export default {
  get run() {
    if (!Run.instance) {
      throw new Error('No RUN instance. Create with `new Run()`.')
    }

    return Run.instance
  }
}