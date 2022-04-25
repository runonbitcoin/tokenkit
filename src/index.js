import * as FT from './tokens/ft.js'
import * as NFT from './tokens/nft.js'
import * as DEX from './tokens/dex.js'
import { upgradeClass } from './tokens/shared.js'

export default {
  /**
   * Fungible tokens interface.
   */
  ft: FT,

  /**
   * Non-fungible tokens interface.
   */
  nft: NFT,

  /**
   * DEX interface.
   */
  dex: DEX,

  /**
   * Utility functions interface.
   */
  util: {
    upgradeClass
  }
}
