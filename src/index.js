import $ from './state.js'
import * as FT from './tokens/ft.js'
import * as NFT from './tokens/nft.js'
import { upgradeClass } from './tokens/shared.js'

export default {
  /**
   * Initialise tokenkit with the active RUN instance.
   * 
   * @param {Run} run 
   */
  init(run) {
    $.run = run
  },

  /**
   * Fungible tokens interface.
   */
  ft: FT,

  /**
   * Non-fungible tokens interface.
   */
  nft: NFT,

  /**
   * Utility functions interface.
   */
  util: {
    upgradeClass
  }
}
