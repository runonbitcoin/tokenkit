import chai, { assert } from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { nftFixture as fixture } from '../support/fixtures.js'
import * as tokenkit from '../../src/index.js'
import { JigBox } from '../../src/tokens/box.js'
import '../support/run.js'

chai.use(chaiAsPromised)


describe('tokenkit.nft.create()', () => {
  it('returns a class with valid parameters', async () => {
    const klass = await tokenkit.nft.create(fixture)

    assert.match(klass.toString(), /^class\s+/)
    assert.equal(klass.name, 'FooNFT')
    assert.equal(klass.metadata.name, 'Foo bar')
    assert.doesNotHaveAnyKeys(klass, ['location', 'origin', 'nonce', 'owner', 'satoshis'])
  })

  it('returns a class with default static properties', async () => {
    const klass = await tokenkit.nft.create(fixture)

    assert.equal(klass.supply, 0)
    assert.equal(klass.version, '1.0')
  })

  it('accepts maxSupply number', async () => {
    const klass = await tokenkit.nft.create({
      ...fixture,
      maxSupply: 500,
    })

    assert.equal(klass.maxSupply, 500)
  })

  it('accepts arbitrary properties', async () => {
    const klass = await tokenkit.nft.create({
      ...fixture,
      foo: 'bar',
    })

    assert.equal(klass.foo, 'bar')
  })

  it('ignores function properties', async () => {
    const klass = await tokenkit.nft.create({
      ...fixture,
      foo() { return 'bar' },
    })

    assert.isUndefined(klass.foo)
  })

  it('has a default class name', async () => {
    const klass = await tokenkit.nft.create({
      ...fixture,
      className: undefined,
    })

    assert.equal(klass.name, 'NFT')
  })

  it('throws error when metadata is missing', async () => {
    const promise = tokenkit.nft.create({
      ...fixture,
      metadata: undefined,
    })

    await assert.isRejected(promise, /^'metadata' is invalid/)
  })

  it('throws error when maxSupply is invalid', async () => {
    const promise = tokenkit.nft.create({
      ...fixture,
      maxSupply: 'abc',
    })

    await assert.isRejected(promise, /^'maxSupply' is invalid/)
  })
})


describe('tokenkit.nft.deploy()', () => {
  it('returns a deployed class with valid parameters', async () => {
    const klass = await tokenkit.nft.deploy(fixture)

    assert.match(klass.toString(), /^class\s+/)
    assert.equal(klass.name, 'FooNFT')
    assert.containsAllKeys(klass, ['location', 'origin', 'nonce', 'owner', 'satoshis'])
  })

  it('accepts a class', async () => {
    const klass = await tokenkit.nft.create(fixture)
    const result = await tokenkit.nft.deploy(klass)

    assert.match(result.toString(), /^class\s+/)
    assert.equal(result.name, 'FooNFT')
    assert.containsAllKeys(result, ['location', 'origin', 'nonce', 'owner', 'satoshis'])
  })

  it('throws error when params invalid', async () => {
    await assert.isRejected(tokenkit.nft.create({}))
  })
})


describe('tokenkit.nft.mint()', () => {
  it('returns a txid when given a list of owners', async () => {
    const klass = await tokenkit.nft.deploy(fixture)

    const txid = await tokenkit.nft.mint(klass.origin, [
      'mmcDhzEZuU1sb2usKzQt6vQCDsGzyx5tEQ',
      'mfjPijd3gNj1Tx7QcdZaSWCEYbxfeVRaxN',
      'mgxGAWN13irNZi1B8LdHXc4E8scDaAVRUV',
    ])

    assert.isString(txid)
    assert.lengthOf(txid, 64)
  })

  it('accepts an array of arrays for extra args', async () => {
    const klass = await tokenkit.nft.deploy(fixture)

    const txid = await tokenkit.nft.mint(klass.origin, [
      ['mmcDhzEZuU1sb2usKzQt6vQCDsGzyx5tEQ'],
      ['mfjPijd3gNj1Tx7QcdZaSWCEYbxfeVRaxN'],
      ['mgxGAWN13irNZi1B8LdHXc4E8scDaAVRUV'],
    ])

    assert.isString(txid)
    assert.lengthOf(txid, 64)
  })

  it('updates the class supply', async () => {
    const klass = await tokenkit.nft.deploy(fixture)

    await tokenkit.nft.mint(klass.origin, [
      'mmcDhzEZuU1sb2usKzQt6vQCDsGzyx5tEQ',
      'mfjPijd3gNj1Tx7QcdZaSWCEYbxfeVRaxN',
      'mgxGAWN13irNZi1B8LdHXc4E8scDaAVRUV',
    ])

    await klass.sync()
    assert.equal(klass.supply, 3)
  })

  it('throws error if max supply is exceeded', async () => {
    const klass = await tokenkit.nft.deploy({
      ...fixture,
      maxSupply: 2,
    })

    const promise = tokenkit.nft.mint(klass.origin, [
      'mmcDhzEZuU1sb2usKzQt6vQCDsGzyx5tEQ',
      'mfjPijd3gNj1Tx7QcdZaSWCEYbxfeVRaxN',
      'mgxGAWN13irNZi1B8LdHXc4E8scDaAVRUV',
    ])

    await assert.isRejected(promise, 'Maximum supply exceeded')
  })

  it('throws error when invalid recipients', async () => {
    const klass = await tokenkit.nft.deploy(fixture)
    await assert.isRejected(tokenkit.nft.mint(klass.origin), /^Invalid recipients/)
  })
})


describe('tokenkit.nft.upgrade()', () => {
  it('returns the upgraded class with valid parameters', async () => {
    const klass = await tokenkit.nft.deploy({
      ...fixture,
      foo: 'bar',
    })

    const upgraded = await tokenkit.nft.upgrade(klass.origin, {
      ...fixture,
      metadata: { name: 'Foo bar 2' },
      foo: 'baz'
    })

    assert.equal(upgraded.metadata.name, 'Foo bar 2')
    assert.equal(upgraded.foo, 'baz')
  })

  it('wont change protected state', async () => {
    const klass = await tokenkit.nft.deploy({
      ...fixture,
      maxSupply: 1000,
    })

    const upgraded = await tokenkit.nft.upgrade(klass.origin, {
      ...fixture,
      maxSupply: 2000,
      supply: 200,
    })

    assert.notEqual(upgraded.maxSupply, 2000)
    assert.notEqual(upgraded.supply, 200)
    assert.equal(upgraded.maxSupply, 1000)
    assert.equal(upgraded.supply, 0)
  })

  it('accepts an already created class', async () => {
    const klass = await tokenkit.nft.deploy({
      ...fixture,
      foo: 'bar',
    })

    const newClass = await tokenkit.nft.create({
      ...fixture,
      metadata: { name: 'Foo bar 2' },
      foo: 'baz',
    })

    const upgraded = await tokenkit.nft.upgrade(klass.origin, newClass)

    assert.equal(upgraded.metadata.name, 'Foo bar 2')
    assert.equal(upgraded.foo, 'baz')
  })

  it('wont upgrade if upgradable is false', async () => {
    const klass = await tokenkit.nft.deploy({
      ...fixture,
      foo: 'bar',
      upgradable: false,
    })

    const promise = tokenkit.nft.upgrade(klass.origin, {
      ...fixture,
      foo: 'baz',
    })

    await assert.isRejected(promise, /is non-upgradable/)
  })
})


describe('transferable: true', () => {
  it('class is not transferable by default', async () => {
    const klass = await tokenkit.nft.deploy(fixture)
    assert.isUndefined(klass.transfer)
  })

  it('class is transferable if option specified', async () => {
    const klass = await tokenkit.nft.deploy({
      ...fixture,
      transferable: true
    })

    assert.isFunction(klass.transfer)
    klass.transfer('mgxGAWN13irNZi1B8LdHXc4E8scDaAVRUV')
    await klass.sync()
    assert.equal(klass.owner, 'mgxGAWN13irNZi1B8LdHXc4E8scDaAVRUV')
  })
})


describe('tokenkit.nft.getJigBox()', () => {
  it('returns the RUN owners JigBox for the given origin', async () => {
    const klass = await tokenkit.nft.deploy(fixture)
    const box = await tokenkit.nft.getJigBox(klass.origin)
    assert.instanceOf(box, JigBox)
    assert.equal(box.type, 'NFT')
  })
})