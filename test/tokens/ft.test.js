import chai, { assert } from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { ftFixture as fixture } from '../support/fixtures.js'
import tokenkit from '../../src/index.js'
import { JigBox } from '../../src/tokens/box.js'
import '../support/run.js'

chai.use(chaiAsPromised)


describe('tokenkit.ft.create()', () => {
  it('returns a class with valid parameters', async () => {
    const klass = await tokenkit.ft.create(fixture)

    assert.match(klass.toString(), /^class\s+/)
    assert.equal(klass.name, 'FooCoin')
    assert.equal(klass.metadata.name, 'Foo Coin')
    assert.equal(klass.symbol, 'FOO')
    assert.doesNotHaveAnyKeys(klass, ['location', 'origin', 'nonce', 'owner', 'satoshis'])
  })

  it('returns a class with default static properties', async () => {
    const klass = await tokenkit.ft.create(fixture)

    assert.equal(klass.decimals, 0)
    assert.equal(klass.supply, 0)
    assert.equal(klass.version, '2.0')
  })

  it('accepts decimals number', async () => {
    const klass = await tokenkit.ft.create({
      ...fixture,
      decimals: 8,
    })

    assert.equal(klass.decimals, 8)
  })

  it('accepts arbitrary properties', async () => {
    const klass = await tokenkit.ft.create({
      ...fixture,
      foo: 'bar',
    })

    assert.equal(klass.foo, 'bar')
  })

  it('ignores function properties', async () => {
    const klass = await tokenkit.ft.create({
      ...fixture,
      foo() { return 'bar' },
    })

    assert.isUndefined(klass.foo)
  })

  it('has a default class name', async () => {
    const klass = await tokenkit.ft.create({
      ...fixture,
      className: undefined,
    })

    assert.equal(klass.name, 'FT')
  })

  it('throws error when metadata is missing', async () => {
    const promise = tokenkit.ft.create({
      ...fixture,
      metadata: undefined,
    })
    await assert.isRejected(promise, /^'metadata' is invalid/)
  })

  it('throws error when symbol is missing', async () => {
    const promise = tokenkit.ft.create({
      ...fixture,
      symbol: undefined,
    })
    await assert.isRejected(promise, /^'symbol' is invalid/)
  })

  it('throws error when decimals is invalid', async () => {
    const promise = tokenkit.ft.create({
      ...fixture,
      decimals: -23,
    })
    await assert.isRejected(promise, /^'decimals' is invalid/)
  })
})


describe('tokenkit.ft.deploy()', () => {
  it('returns a deployed class with valid parameters', async () => {
    const klass = await tokenkit.ft.deploy(fixture)

    assert.match(klass.toString(), /^class\s+/)
    assert.equal(klass.name, 'FooCoin')
    assert.containsAllKeys(klass, ['location', 'origin', 'nonce', 'owner', 'satoshis'])
  })

  it('accepts a class', async () => {
    const klass = await tokenkit.ft.create(fixture)
    const result = await tokenkit.ft.deploy(klass)

    assert.match(result.toString(), /^class\s+/)
    assert.equal(result.name, 'FooCoin')
    assert.containsAllKeys(result, ['location', 'origin', 'nonce', 'owner', 'satoshis'])
  })

  it('throws error when params invalid', async () => {
    await assert.isRejected(tokenkit.ft.create({}))
  })
})


describe('tokenkit.ft.mint()', () => {
  it('returns a txid when given a list of owners and amounts', async () => {
    const klass = await tokenkit.ft.deploy(fixture)

    const txid = await tokenkit.ft.mint(klass.origin, [
      [5000, 'mmcDhzEZuU1sb2usKzQt6vQCDsGzyx5tEQ'],
      [1000, 'mfjPijd3gNj1Tx7QcdZaSWCEYbxfeVRaxN'],
      [3000, 'mgxGAWN13irNZi1B8LdHXc4E8scDaAVRUV'],
    ])

    assert.isString(txid)
    assert.lengthOf(txid, 64)
  })

  it('updates the class supply', async () => {
    const klass = await tokenkit.ft.deploy(fixture)

    await tokenkit.ft.mint(klass.origin, [
      [5000, 'mmcDhzEZuU1sb2usKzQt6vQCDsGzyx5tEQ'],
      [1000, 'mfjPijd3gNj1Tx7QcdZaSWCEYbxfeVRaxN'],
      [3000, 'mgxGAWN13irNZi1B8LdHXc4E8scDaAVRUV'],
    ])

    await klass.sync()
    assert.equal(klass.supply, 9000)
  })

  it('throws error when invalid recipients', async () => {
    const klass = await tokenkit.ft.deploy(fixture)

    await assert.isRejected(tokenkit.ft.mint(klass.origin), /^Invalid recipients/)

    await assert.isRejected(tokenkit.ft.mint(klass.origin, [
      'mmcDhzEZuU1sb2usKzQt6vQCDsGzyx5tEQ',
      'mfjPijd3gNj1Tx7QcdZaSWCEYbxfeVRaxN',
    ]), /^amount is not a number/)
  })
})


describe('tokenkit.ft.upgrade()', () => {
  it('returns the upgraded class with valid parameters', async () => {
    const klass = await tokenkit.ft.deploy({
      ...fixture,
      foo: 'bar',
    })

    const upgraded = await tokenkit.ft.upgrade(klass.origin, {
      ...fixture,
      metadata: { name: 'Foo Coin 2' },
      foo: 'baz',
    })

    assert.equal(upgraded.metadata.name, 'Foo Coin 2')
    assert.equal(upgraded.foo, 'baz')
  })

  it('wont change protected state', async () => {
    const klass = await tokenkit.ft.deploy({
      ...fixture,
      supply: 100,
    })

    const upgraded = await tokenkit.ft.upgrade(klass.origin, {
      ...fixture,
      supply: 200,
    })

    assert.notEqual(upgraded.supply, 200)
    assert.equal(upgraded.supply, 100)
  })

  it('accepts an already created class', async () => {
    const klass = await tokenkit.ft.deploy({
      ...fixture,
      foo: 'bar'
    })

    const newClass = await tokenkit.ft.create({
      ...fixture,
      metadata: { name: 'Foo Coin 2' },
      foo: 'baz',
    })

    const upgraded = await tokenkit.ft.upgrade(klass.origin, newClass)

    assert.equal(upgraded.metadata.name, 'Foo Coin 2')
    assert.equal(upgraded.foo, 'baz')
  })

  it('wont upgrade if upgradable is false', async () => {
    const klass = await tokenkit.ft.deploy({
      ...fixture,
      foo: 'bar',
      upgradable: false,
    })

    const promise = tokenkit.ft.upgrade(klass.origin, {
      ...fixture,
      foo: 'baz',
    })

    await assert.isRejected(promise, /is non-upgradable/)
  })
})


describe('transferable: true', () => {
  it('class is not transferable by default', async () => {
    const klass = await tokenkit.ft.deploy(fixture)
    assert.isUndefined(klass.transfer)
  })

  it('class is transferable if option specified', async () => {
    const klass = await tokenkit.ft.deploy({
      ...fixture,
      transferable: true
    })

    assert.isFunction(klass.transfer)
    klass.transfer('mgxGAWN13irNZi1B8LdHXc4E8scDaAVRUV')
    await klass.sync()
    assert.equal(klass.owner, 'mgxGAWN13irNZi1B8LdHXc4E8scDaAVRUV')
  })
})


describe('tokenkit.ft.getJigBox()', () => {
  it('returns the RUN owners JigBox for the given origin', async () => {
    const klass = await tokenkit.ft.deploy(fixture)
    const box = await tokenkit.ft.getJigBox(klass.origin)
    assert.instanceOf(box, JigBox)
    assert.equal(box.type, 'FT')
  })
})