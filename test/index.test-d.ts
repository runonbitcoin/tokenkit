import { expectType } from 'tsd'
import tokenkit, {
  txid,
  RunCode,
  JigBox,
  TokenInterface,
  DexInterface,
  UtilInterface,
} from '../src'

// Default interface
expectType<void>( tokenkit.init('Fake Run') )
expectType<TokenInterface>( tokenkit.ft )
expectType<TokenInterface>( tokenkit.nft )
expectType<DexInterface>( tokenkit.dex )
expectType<UtilInterface>( tokenkit.util )

// Token interface
const ftClass = tokenkit.ft.create({
  metadata: { name: 'My Coin' },
  symbol: 'USDT'
})

const ftCode = await tokenkit.ft.deploy({
  metadata: { name: 'My Coin' },
  symbol: 'USDT'
})

expectType<{ new(...args: any[]): any; }>(ftClass)

expectType<RunCode>( await tokenkit.ft.deploy(ftClass) )
expectType<RunCode>(
  await tokenkit.ft.deploy({
    metadata: { name: 'My Coin' },
    symbol: 'USDT'
  })
)

expectType<RunCode>( await tokenkit.ft.upgrade(ftCode.origin, ftClass) )
expectType<RunCode>(
  await tokenkit.ft.upgrade(ftCode.origin, {
    metadata: { name: 'My Coin 2' },
    symbol: 'USDT2'
  })
)

expectType<txid>(
  await tokenkit.ft.mint(ftCode.origin, [
    [5000, 'mmcDhzEZuU1sb2usKzQt6vQCDsGzyx5tEQ'],
    [1000, 'mfjPijd3gNj1Tx7QcdZaSWCEYbxfeVRaxN'],
    [3000, 'mgxGAWN13irNZi1B8LdHXc4E8scDaAVRUV'],
  ])
)

// JigBox interface
const jigbox = await tokenkit.ft.getJigBox(ftCode.origin)

expectType<JigBox>( jigbox )
expectType<JigBox>( await JigBox.fromClass(ftCode, 'nft') )
expectType<JigBox>( await JigBox.fromOrigin(ftCode.origin, 'nft') )

expectType<number>( jigbox.balance )
expectType<string>( jigbox.balanceAsDecimal )

expectType<txid>( await jigbox.send('mgxGAWN13irNZi1B8LdHXc4E8scDaAVRUV', 5000) )
expectType<txid>(
  await jigbox.sendMany([
    ['mfjPijd3gNj1Tx7QcdZaSWCEYbxfeVRaxN', 3600],
    ['mgxGAWN13irNZi1B8LdHXc4E8scDaAVRUV', 2600],
  ])
)
expectType<txid>( await jigbox.burn(5000) )
expectType<void>( await jigbox.sync() )
