# Run TokenKit

TokenKit makes it breathtakingly easy to deploy, mint and interact with fungible and non-fungible tokens using [Run](https://run.network).

Tokens created with TokenKit are compatible with the [RelayX DEX](https://relayx.com/).

## Getting started

TokenKit is a JavaScript library. Install it with `npm` or `yarn`.

```shell
npm install @runonbitcoin/tokenkit
# or
yarn add @runonbitcoin/tokenkit
```

On the web you can load TokenKit from a CDN.

```html
<!--
  It's currently necessary to load nimble separately. In a future version,
  nimble will be bundled with run-sdk.
-->
<script src="https://unpkg.com/run-sdk"></script>
<script src="https://unpkg.com/@runonbitcoin/nimble"></script>
<script src="https://unpkg.com/@runonbitcoin/tokenkit"></script>
```

Before you use TokenKit, you first create a Run instance with your configuration:

```js
const run = new Run({ network: 'main', purse: '<your-purse-key>', owner: '<your-owner-key>' })
```

## Create and mint fungible and non-fungible tokens

Deploy and mint fungible tokens using the `tokenkit.ft` namespace. Pre-upload images and media using [Easy B](https://github.com/runonbitcoin/easy-b).

```js
// Returns deployed Run Code
const MyCoin = tokenkit.ft.deploy({
  metadata: {
    name: 'My Coin',
    description: 'My example token',
    image: 'b://2373632532517983c948df2f32d89ec4a6c64ece1d71698c21b2ad027edfec60',
  },
  symbol: 'MYC',
  decimals: 2,
})

// Mint coins to many recipients - returns txid
await tokenkit.ft.mint(MyCoin.origin, [
  [100000000, '1DsPKMo8s9F4a22Px5F8RpAQoV1dDQ5HD9'],
  [100000000, '1GPe3sjxeDmvXUjP9jaZwnBEunvRLghahi'],
  [100000000, '1EtzqQMMaP8xEjv2mzHKrAN3LXrSEtHPAQ'],
  ...
])
```

The API for non-fungible tokens is almost identical, but note the functions are accessed on the `tokenkit.nft` namespace.

```js
const MyNFT = await tokenkit.nft.deploy({
  metadata: {
    name: 'My NFT',
    description: 'My example NFT',
    image: 'b://4400acfcb88af8584384bd6417056fa374d71b86e1eee59ca5ba937c8b53f254',
  },
  maxSupply: 500,
})

// Mint tokens to many recipients - returns txid
await tokenkit.nft.mint(MyNFT.origin, [
  '1DsPKMo8s9F4a22Px5F8RpAQoV1dDQ5HD9',
  '1GPe3sjxeDmvXUjP9jaZwnBEunvRLghahi',
  '1EtzqQMMaP8xEjv2mzHKrAN3LXrSEtHPAQ',
  ...
])
```

## JigBoxes

A `JigBox` is, well, a box of Jigs. It provides a simple interface through which you can work with the current Run owner's jigs for a given class.

When used with fungible token classes, JigBoxes make it simple to combine, send and burn tokens.

```js
const box = await tokenkit.ft.getJigBox(origin)

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

❗️ Note that non-fungible token JigBoxes have a smaller API surface.

The balance properties and send functions do not apply to NFT JigBoxes. Instead access the jigs directly and use the send method on the jig itself.

```js
const box = await tokenkit.nft.getJigBox(origin)

box.contract            // deployedCode
box.type                // FT or NFT
box.jigs                // array of jigs
box.sync()              // syncs the jig box
```

## Upgrading classes

For simple changes, for example to upgrade metadata, the `TokenInterface` provides an easy upgrade function.

```js
const upgradedCode = tokenkit.nft.upgrade(origin, {
  metadata: {
    image: 'b://30dc4529b612dc76e35c9a54474ad56053c5a033d432f4152ce34c6aca2981ac',
    ...
  }
})
```

A lower level function can be used for upgrading custom classes not built with tokenkit.

```js
// By default all static properties from the original class are copied to the
// new class. Avoid this by explicitly listing changed static props.
const upgradedCode = tokenkit.util.upgradeClass(origin, NewClass, ['metadata', 'license'])
```

## Transferring classes

If a class is created with `transferable: true`, it can be transferred to new owners.

```js
const MyCoin = await tokenkit.ft.deploy({
  className: 'MyCoin',
  transferable: true
})

await MyCoin.transfer('13fDD3U6PdM5VWHwgLDPwZ3itzgU2BRcDW')
```

## API

### Top-level interface

| namespace      | interface                              |
| -------------- | -------------------------------------- |
| `tokenkit.ft`  | `TokenInterface` (fungible tokens)     |
| `tokenkit.nft` | `TokenInterface` (non-fungible tokens) |

### `TokenInterface`

The `TokenInterface` is an API for creating, minting and upgrading token classes.

| function                                             | returns           |
| ---------------------------------------------------- | ----------------- |
| `create(params: object)`                             | `Promise<class>`  |
| `deploy(params: object \| class)`                    | `Promise<Code>`   |
| `mint(origin: string, recipients: object[])`         | `Promise<string>` |
| `upgrade(origin: string, params: object \| class)`   | `Promise<Code>`   |
| `getJigBox(origin: string, params: object \| class)` | `Promise<JigBox>` |

### `JigBox` API

The JigBox API makes it simple to combine, send and burn tokens.

| property / function                           | returns           |
| --------------------------------------------- | ----------------- |
| `contract`                                    | `Code`            |
| `type`                                        | `"ft"` or `"nft"` |
| `jigs`                                        | `Jig[]`           |
| `balance`                                     | `number`          |
| `balanceAsDecimal`                            | `string`          |
| `send(owner: string \| Lock, amount: number)` | `Promise<string>` |
| `sendMany(recipients: object[])`              | `Promise<string>` |
| `burn(amount: number)`                        | `Promise<string>` |
| `sync()`                                      | `Promise<void>`   |

## License

TokenKit is open source and released under the [MIT License](https://github.com/runonbitcoin/tokenkit/blob/master/LICENSE).

Copyright (c) 2022 Run Interactive, Inc.
