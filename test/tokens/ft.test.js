import chai, { assert } from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { run } from '../support/run.js'
import { ftFixture as fixture } from '../support/fixtures.js'
import { JigBox } from '../../src/tokens/box.js'
import tokenkit from '../../src/index.js'

const FT = tokenkit.ft

chai.use(chaiAsPromised)
tokenkit.init(run)


describe('FT.create()', () => {
  it('returns a class with valid parameters', () => {
    const klass = FT.create(fixture)

    assert.match(klass.toString(), /^class\s+/)
    assert.equal(klass.name, 'FooCoin')
    assert.equal(klass.metadata.title, 'Foo Coin')
    assert.equal(klass.symbol, 'FOO')
    assert.doesNotHaveAnyKeys(klass, ['location', 'origin', 'nonce', 'owner', 'satoshis'])
  })

  it('returns a class with default static properties', () => {
    const klass = FT.create(fixture)

    assert.equal(klass.decimals, 0)
    assert.equal(klass.supply, 0)
    assert.equal(klass.version, '2.0')
  })

  it('accepts decimals number', () => {
    const klass = FT.create({
      ...fixture,
      decimals: 8,
    })

    assert.equal(klass.decimals, 8)
  })

  it('accepts arbitrary properties', () => {
    const klass = FT.create({
      ...fixture,
      foo: 'bar',
    })

    assert.equal(klass.foo, 'bar')
  })

  it('ignores function properties', () => {
    const klass = FT.create({
      ...fixture,
      foo() { return 'bar' },
    })

    assert.isUndefined(klass.foo)
  })

  it('throws error when name is missing', () => {
    assert.throws(() => {
      FT.create({
        ...fixture,
        name: undefined,
      })
    }, 'name param is invalid')
  })

  it('throws error when metadata is missing', () => {
    assert.throws(() => {
      FT.create({
        ...fixture,
        metadata: undefined,
      })
    }, 'metadata param is invalid')
  })

  it('throws error when symbol is missing', () => {
    assert.throws(() => {
      FT.create({
        ...fixture,
        symbol: undefined,
      })
    }, 'symbol param is invalid')
  })

  it('throws error when decimals is invalid', () => {
    assert.throws(() => {
      FT.create({
        ...fixture,
        decimals: -23,
      })
    }, 'decimals param is invalid')
  })
})


describe('FT.deploy()', () => {
  it('returns a deployed class with valid parameters', async () => {
    const klass = await FT.deploy(fixture)

    assert.match(klass.toString(), /^class\s+/)
    assert.equal(klass.name, 'FooCoin')
    assert.containsAllKeys(klass, ['location', 'origin', 'nonce', 'owner', 'satoshis'])
  })

  it('accepts a class', async () => {
    const klass = FT.create(fixture)
    const result = await FT.deploy(klass)

    assert.match(result.toString(), /^class\s+/)
    assert.equal(result.name, 'FooCoin')
    assert.containsAllKeys(result, ['location', 'origin', 'nonce', 'owner', 'satoshis'])
  })

  it('throws error when params invalid', () => {
    assert.throws(() => FT.create({}))
  })
})


describe('FT.mint()', () => {
  it('returns a txid when given a list of owners and amounts', async () => {
    const klass = await FT.deploy(fixture)

    const txid = await FT.mint(klass.origin, [
      [5000, 'mmcDhzEZuU1sb2usKzQt6vQCDsGzyx5tEQ'],
      [1000, 'mfjPijd3gNj1Tx7QcdZaSWCEYbxfeVRaxN'],
      [3000, 'mgxGAWN13irNZi1B8LdHXc4E8scDaAVRUV'],
    ])

    assert.isString(txid)
    assert.lengthOf(txid, 64)
  })

  it('updates the class supply', async () => {
    const klass = await FT.deploy(fixture)

    await FT.mint(klass.origin, [
      [5000, 'mmcDhzEZuU1sb2usKzQt6vQCDsGzyx5tEQ'],
      [1000, 'mfjPijd3gNj1Tx7QcdZaSWCEYbxfeVRaxN'],
      [3000, 'mgxGAWN13irNZi1B8LdHXc4E8scDaAVRUV'],
    ])

    await klass.sync()
    assert.equal(klass.supply, 9000)
  })

  it('throws error when invalid recipients', async () => {
    const klass = await FT.deploy(fixture)

    await assert.isRejected(FT.mint(klass.origin), /^Invalid recipients/)

    await assert.isRejected(FT.mint(klass.origin, [
      'mmcDhzEZuU1sb2usKzQt6vQCDsGzyx5tEQ',
      'mfjPijd3gNj1Tx7QcdZaSWCEYbxfeVRaxN',
    ]), /^amount is not a number/)
  })
})


describe('FT.upgrade()', () => {
  it('returns the upgraded class with valid parameters', async () => {
    const klass = await FT.deploy({
      ...fixture,
      foo: 'bar',
    })

    const upgraded = await FT.upgrade(klass.origin, {
      ...fixture,
      metadata: { title: 'Foo Coin 2' },
      foo: 'baz',
    })

    assert.equal(upgraded.metadata.title, 'Foo Coin 2')
    assert.equal(upgraded.foo, 'baz')
  })

  it('wont change protected state', async () => {
    const klass = await FT.deploy({
      ...fixture,
      supply: 100,
    })

    const upgraded = await FT.upgrade(klass.origin, {
      ...fixture,
      supply: 200,
    })

    assert.notEqual(upgraded.supply, 200)
    assert.equal(upgraded.supply, 100)
  })

  it('accepts an already created class', async () => {
    const klass = await FT.deploy({
      ...fixture,
      foo: 'bar'
    })

    const newClass = await FT.create({
      ...fixture,
      metadata: { title: 'Foo Coin 2' },
      foo: 'baz',
    })

    const upgraded = await FT.upgrade(klass.origin, newClass)

    assert.equal(upgraded.metadata.title, 'Foo Coin 2')
    assert.equal(upgraded.foo, 'baz')
  })

  it('wont upgrade if upgradable is false', async () => {
    const klass = await FT.deploy({
      ...fixture,
      foo: 'bar',
      upgradable: false,
    })

    const promise = FT.upgrade(klass.origin, {
      ...fixture,
      foo: 'baz',
    })

    assert.isRejected(promise, /is non-upgradable/)
  })
})


describe('transferable: true', () => {
  it('class is not transferable by default', async () => {
    const klass = await FT.deploy(fixture)
    assert.isUndefined(klass.transfer)
  })

  it('class is transferable if option specified', async () => {
    const klass = await FT.deploy({
      ...fixture,
      transferable: true
    })

    assert.isFunction(klass.transfer)
    klass.transfer('mgxGAWN13irNZi1B8LdHXc4E8scDaAVRUV')
    await klass.sync()
    assert.equal(klass.owner, 'mgxGAWN13irNZi1B8LdHXc4E8scDaAVRUV')
  })
})


describe('FT.getJigBox()', () => {
  it('returns the RUN owners JigBox for the given origin', async () => {
    const klass = await FT.deploy(fixture)
    const box = await FT.getJigBox(klass.origin)
    assert.instanceOf(box, JigBox)
    assert.equal(box.type, 'FT')
  })
})