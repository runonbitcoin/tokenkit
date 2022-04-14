import { expectType } from 'tsd'
import tokenkit, { TokenInterface } from '.'

expectType<void>( tokenkit.init('Fake Run') )
expectType<TokenInterface>( tokenkit.ft )
expectType<TokenInterface>( tokenkit.nft )