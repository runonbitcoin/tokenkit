import Run from 'run-sdk'

/**
 * Module to fetch global Run instance.
 */
export default {
  Run,

  get run() {
    if (!Run.instance) {
      throw new Error('No RUN instance. Create with `new Run()`.')
    }

    return Run.instance
  }
}