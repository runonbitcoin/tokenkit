# Run Token Kit

Docs TODO

## Getting started

Install

```console
npm install @runonbitcoin/tokenkit
# or
yarn add @runonbitcoin/tokenkit
```

or

```html
<script src="//unpkg.com/univrse/@runonbitcoin/tokenkit"></script>
```

Setup

```js
import Run from 'run-sdk'
import tokenkit from '@runonbitcoin/tokenkit'

const run = new Run()
tokenkit.init(run)
```

## Create and mint tokens

Fungible tokens

```js
// Returns a class
const MyCoin = tokenkit.ft.create({
  name: 'MyCoin',
  metadata: {
    name: 'My Coin',
    description: 'My example token',
    image: 'b://2373632532517983c948df2f32d89ec4a6c64ece1d71698c21b2ad027edfec60',
  },
  symbol: 'MYC',
  decimals: 2,
})

// Deploys a class - accepts a class or same params as above
const deployedCode = await tokenkit.ft.deploy(MyCoin)

// Mint coins to many recipients - returns txid
await tokenkit.ft.mint(deployedCode.origin, [
  [100000000, '1DsPKMo8s9F4a22Px5F8RpAQoV1dDQ5HD9'],
  [100000000, '1GPe3sjxeDmvXUjP9jaZwnBEunvRLghahi'],
  [100000000, '1EtzqQMMaP8xEjv2mzHKrAN3LXrSEtHPAQ'],
  ...
])
```

Non-fungible tokens - almost identical api

```js
const deployedCode = await tokenkit.ft.deploy({
  name: 'MyNFT',
  metadata: {
    name: 'My NFT',
    description: 'My example NFT',
    image: 'b://4400acfcb88af8584384bd6417056fa374d71b86e1eee59ca5ba937c8b53f254',
  },
  maxSupply: 500,
})

// Mint tokens to many recipients - returns txid
await tokenkit.ft.mint(deployedCode.origin, [
  '1DsPKMo8s9F4a22Px5F8RpAQoV1dDQ5HD9',
  '1GPe3sjxeDmvXUjP9jaZwnBEunvRLghahi',
  '1EtzqQMMaP8xEjv2mzHKrAN3LXrSEtHPAQ',
  ...
])
```

## JigBoxes

Work with the Run owners account of a given token

```js
const box = tokenkit.ft.getJigBox(origin)

// API
box.contract            // deployedCode
box.type                // FT or NFT
box.jigs                // array of jigs
box.balance             // sum of jig amounts
box.balanceAsDecimal    // sum of jig amounts as decimal string

// Send amount to single recipient - returns txid
await box.send('1FCKGH5tTjSkLgiQEKzoaKzDcBCD5dVHX6', 100000)

// Send amount to many recipients - returns txid
await box.sendMany([
  ['1FCKGH5tTjSkLgiQEKzoaKzDcBCD5dVHX6', 100000],
  ['1LANVRCyXPDco6UcoDmfXwNpc6Td55DBKK', 100000],
  ['18zLfZ2occiWTcrS2sjraL1ARveh8Qrad9', 100000],
])

// Sync the jig box (happens automatically after send)
await box.sync()
```

Fungible token JigBoxes have a smaller API surface

```js
const box = tokenkit.nft.getJigBox(origin)

box.contract            // deployedCode
box.type                // FT or NFT
box.jigs                // array of jigs
box.sync()              // syncs the jib box
```

The balance properties and send functions do not apply to NFT JigBoxes. Instead
access the jigs directly and use the send method on the jig itself.

## Upgrading classes

For simple changes, for example to upgrade metadata...

```js
const upgradedCode = tokenkit.nft.upgrade(origin, {
  name: 'MyCoin',
  metadata: {
    image: 'b://30dc4529b612dc76e35c9a54474ad56053c5a033d432f4152ce34c6aca2981ac',
    ...
  }
})
```

A lower level function can be used for upgrading custom classes not built with
tokenkit.

```js
// By default all static properties from the original class are copied to the
// new class. Avoid this by explicitly listing changed static props.
const upgradedCode = tokenkit.util.upgradeClass(origin, NewClass, ['metadata', 'license'])
```

## Transferring classes

If a class is created with `transferable: true`, it can be transferred to new owners.

```js
const MyCoin = await tokenkit.ft.deploy({
  name: 'MyCoin',
  transferable: true
})

await MyCoin.transfer('13fDD3U6PdM5VWHwgLDPwZ3itzgU2BRcDW')
```

