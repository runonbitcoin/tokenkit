import chai, { assert } from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { run } from '../support/run.js'
import { nftFixture as fixture } from '../support/fixtures.js'
import { JigBox } from '../../src/tokens/box.js'
import tokenkit from '../../src/index.js'

const NFT = tokenkit.nft

chai.use(chaiAsPromised)
tokenkit.init(run)


describe('NFT.create()', () => {
  it('returns a class with valid parameters', () => {
    const klass = NFT.create(fixture)

    assert.match(klass.toString(), /^class\s+/)
    assert.equal(klass.name, 'FooNFT')
    assert.equal(klass.metadata.title, 'Foo bar')
    assert.doesNotHaveAnyKeys(klass, ['location', 'origin', 'nonce', 'owner', 'satoshis'])
  })

  it('returns a class with default static properties', () => {
    const klass = NFT.create(fixture)

    assert.equal(klass.supply, 0)
    assert.equal(klass.version, '1.0')
  })

  it('accepts maxSupply number', () => {
    const klass = NFT.create({
      ...fixture,
      maxSupply: 500,
    })

    assert.equal(klass.maxSupply, 500)
  })

  it('accepts arbitrary properties', () => {
    const klass = NFT.create({
      ...fixture,
      foo: 'bar',
    })

    assert.equal(klass.foo, 'bar')
  })

  it('ignores function properties', () => {
    const klass = NFT.create({
      ...fixture,
      foo() { return 'bar' },
    })

    assert.isUndefined(klass.foo)
  })

  it('throws error when name is missing', () => {
    assert.throws(() => {
      NFT.create({
        ...fixture,
        name: undefined,
      })
    }, 'name param is invalid')
  })

  it('throws error when metadata is missing', () => {
    assert.throws(() => {
      NFT.create({
        ...fixture,
        metadata: undefined,
      })
    }, 'metadata param is invalid')
  })

  it('throws error when maxSupply is invalid', () => {
    assert.throws(() => {
      NFT.create({
        ...fixture,
        maxSupply: 'abc',
      })
    }, 'maxSupply param is invalid')
  })
})


describe('NFT.deploy()', () => {
  it('returns a deployed class with valid parameters', async () => {
    const klass = await NFT.deploy(fixture)

    assert.match(klass.toString(), /^class\s+/)
    assert.equal(klass.name, 'FooNFT')
    assert.containsAllKeys(klass, ['location', 'origin', 'nonce', 'owner', 'satoshis'])
  })

  it('accepts a class', async () => {
    const klass = NFT.create(fixture)
    const result = await NFT.deploy(klass)

    assert.match(result.toString(), /^class\s+/)
    assert.equal(result.name, 'FooNFT')
    assert.containsAllKeys(result, ['location', 'origin', 'nonce', 'owner', 'satoshis'])
  })

  it('throws error when params invalid', () => {
    assert.throws(() => NFT.create({}))
  })
})


describe('NFT.mint()', () => {
  it('returns a txid when given a list of owners', async () => {
    const klass = await NFT.deploy(fixture)

    const txid = await NFT.mint(klass.origin, [
      'mmcDhzEZuU1sb2usKzQt6vQCDsGzyx5tEQ',
      'mfjPijd3gNj1Tx7QcdZaSWCEYbxfeVRaxN',
      'mgxGAWN13irNZi1B8LdHXc4E8scDaAVRUV',
    ])

    assert.isString(txid)
    assert.lengthOf(txid, 64)
  })

  it('accepts an array of arrays for extra args', async () => {
    const klass = await NFT.deploy(fixture)

    const txid = await NFT.mint(klass.origin, [
      ['mmcDhzEZuU1sb2usKzQt6vQCDsGzyx5tEQ'],
      ['mfjPijd3gNj1Tx7QcdZaSWCEYbxfeVRaxN'],
      ['mgxGAWN13irNZi1B8LdHXc4E8scDaAVRUV'],
    ])

    assert.isString(txid)
    assert.lengthOf(txid, 64)
  })

  it('updates the class supply', async () => {
    const klass = await NFT.deploy(fixture)

    await NFT.mint(klass.origin, [
      'mmcDhzEZuU1sb2usKzQt6vQCDsGzyx5tEQ',
      'mfjPijd3gNj1Tx7QcdZaSWCEYbxfeVRaxN',
      'mgxGAWN13irNZi1B8LdHXc4E8scDaAVRUV',
    ])

    await klass.sync()
    assert.equal(klass.supply, 3)
  })

  it('throws error if max supply is exceeded', async () => {
    const klass = await NFT.deploy({
      ...fixture,
      maxSupply: 2,
    })

    const promise = NFT.mint(klass.origin, [
      'mmcDhzEZuU1sb2usKzQt6vQCDsGzyx5tEQ',
      'mfjPijd3gNj1Tx7QcdZaSWCEYbxfeVRaxN',
      'mgxGAWN13irNZi1B8LdHXc4E8scDaAVRUV',
    ])

    await assert.isRejected(promise, 'Maximum supply exceeded')
  })

  it('throws error when invalid recipients', async () => {
    const klass = await NFT.deploy(fixture)
    await assert.isRejected(NFT.mint(klass.origin), /^Invalid recipients/)
  })
})


describe('NFT.upgrade()', () => {
  it('returns the upgraded class with valid parameters', async () => {
    const klass = await NFT.deploy({
      ...fixture,
      foo: 'bar',
    })

    const upgraded = await NFT.upgrade(klass.origin, {
      ...fixture,
      metadata: { title: 'Foo bar 2' },
      foo: 'baz'
    })

    assert.equal(upgraded.metadata.title, 'Foo bar 2')
    assert.equal(upgraded.foo, 'baz')
  })

  it('wont change protected state', async () => {
    const klass = await NFT.deploy({
      ...fixture,
      maxSupply: 1000,
    })

    const upgraded = await NFT.upgrade(klass.origin, {
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
    const klass = await NFT.deploy({
      ...fixture,
      foo: 'bar',
    })

    const newClass = await NFT.create({
      ...fixture,
      metadata: { title: 'Foo bar 2' },
      foo: 'baz',
    })

    const upgraded = await NFT.upgrade(klass.origin, newClass)

    assert.equal(upgraded.metadata.title, 'Foo bar 2')
    assert.equal(upgraded.foo, 'baz')
  })

  it('wont upgrade if upgradable is false', async () => {
    const klass = await NFT.deploy({
      ...fixture,
      foo: 'bar',
      upgradable: false,
    })

    const promise = NFT.upgrade(klass.origin, {
      ...fixture,
      foo: 'baz',
    })

    assert.isRejected(promise, /is non-upgradable/)
  })
})


describe('transferable: true', () => {
  it('class is not transferable by default', async () => {
    const klass = await NFT.deploy(fixture)
    assert.isUndefined(klass.transfer)
  })

  it('class is transferable if option specified', async () => {
    const klass = await NFT.deploy({
      ...fixture,
      transferable: true
    })

    assert.isFunction(klass.transfer)
    klass.transfer('mgxGAWN13irNZi1B8LdHXc4E8scDaAVRUV')
    await klass.sync()
    assert.equal(klass.owner, 'mgxGAWN13irNZi1B8LdHXc4E8scDaAVRUV')
  })
})


describe('NFT.getJigBox()', () => {
  it('returns the RUN owners JigBox for the given origin', async () => {
    const klass = await NFT.deploy(fixture)
    const box = await NFT.getJigBox(klass.origin)
    assert.instanceOf(box, JigBox)
    assert.equal(box.type, 'NFT')
  })
})