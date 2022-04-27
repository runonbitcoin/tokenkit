import chai, { assert } from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { ftFixture, nftFixture } from '../support/fixtures.js'
import * as tokenkit from '../../src/index.js'
import { JigBox } from '../../src/tokens/box.js'
import { run } from '../support/run.js'

chai.use(chaiAsPromised)


describe('JigBox', () => {
  let klass 
  before(async () => {
    klass = await tokenkit.ft.deploy(ftFixture)
  })

  it('new JigBox() instantiates a new box', () => {
    const box = new JigBox({ contract: klass, type: 'ft' })
    assert.instanceOf(box, JigBox)
    assert.deepEqual(box.contract, klass)
    assert.isArray(box.jigs)
    assert.equal(box.type, 'FT')
  })

  it('throws error with invalid type', () => {
    assert.throws(() => {
      new JigBox({ contract: klass, type: 'xxx' })
    }, /^Invalid JigBox type/)
  })

  it('JigBox.fromClass() instantiates from a class', async () => {
    const box = await JigBox.fromClass(klass, 'ft')
    assert.instanceOf(box, JigBox)
  })

  it('JigBox.fromOrigin() instantiates from an origin', async () => {
    const box = await JigBox.fromOrigin(klass.origin, 'ft')
    assert.instanceOf(box, JigBox)
  })
})


describe('JigBox#balance and JigBox#balanceAsDecimal', () => {
  it('returns the sum of all jigs', async () => {
    const klass = await tokenkit.ft.deploy(ftFixture)
    await tokenkit.ft.mint(klass.origin, [
      [5000, run.owner.address],
      [1000, run.owner.address],
      [3000, run.owner.address],
    ])

    const box = await tokenkit.ft.getJigBox(klass.origin)
    assert.equal(box.balance, 9000)
    assert.equal(box.balanceAsDecimal, '9000')
  })

  it('correctly handles decimals', async () => {
    const klass = await tokenkit.ft.deploy({
      ...ftFixture,
      decimals: 2
    })
    await tokenkit.ft.mint(klass.origin, [
      [5020, run.owner.address],
      [1001, run.owner.address],
      [3048, run.owner.address],
    ])
    
    const box = await tokenkit.ft.getJigBox(klass.origin)
    assert.equal(box.balance, 9069)
    assert.equal(box.balanceAsDecimal, '90.69')
  })

  it('throws an error with NFT boxes', async () => {
    const klass = await tokenkit.nft.deploy(nftFixture)

    const box = await tokenkit.nft.getJigBox(klass.origin)
    assert.throws(() => box.balance, /^Method unavailable/)
  })
})


describe('JigBox#jigs', () => {
  it('returns an array of jigs', async () => {
    const klass = await tokenkit.ft.deploy(ftFixture)
    await tokenkit.ft.mint(klass.origin, [
      [5000, run.owner.address],
      [1000, run.owner.address],
      [3000, run.owner.address],
    ])

    const box = await tokenkit.ft.getJigBox(klass.origin)
    assert.isArray(box.jigs)
    assert.lengthOf(box.jigs, 3)
  })
})


describe('JigBox#send()', () => {
  let box
  beforeEach(async () => {
    const klass = await tokenkit.ft.deploy(ftFixture)
    await tokenkit.ft.mint(klass.origin, [
      [5000, run.owner.address],
      [1000, run.owner.address],
      [3000, run.owner.address],
    ])

    box = await tokenkit.ft.getJigBox(klass.origin)
  })

  it('sends tokens to the recipient', async () => {
    assert.equal(box.balance, 9000)
    const txid = await box.send('mgxGAWN13irNZi1B8LdHXc4E8scDaAVRUV', 5000)
    assert.isString(txid)
    assert.lengthOf(txid, 64)

    assert.lengthOf(box.jigs, 1)
    assert.equal(box.balance, 4000)
  })

  it('throws an error when insufficient balance', async () => {
    const promise = box.send('mgxGAWN13irNZi1B8LdHXc4E8scDaAVRUV', 15000)
    await assert.isRejected(promise, 'Not enough funds')
  })

  it('throws an error with NFT boxes', async () => {
    const klass = await tokenkit.nft.deploy(nftFixture)
    const box = await tokenkit.nft.getJigBox(klass.origin)
    const promise = box.send('mgxGAWN13irNZi1B8LdHXc4E8scDaAVRUV', 5000)
    await assert.isRejected(promise, /^Method unavailable/)
  })
})


describe('JigBox#sendMany()', () => {
  let box
  beforeEach(async () => {
    const klass = await tokenkit.ft.deploy(ftFixture)
    await tokenkit.ft.mint(klass.origin, [
      [5000, run.owner.address],
      [1000, run.owner.address],
      [3000, run.owner.address],
    ])

    box = await tokenkit.ft.getJigBox(klass.origin)
  })

  it('sends tokens to multiple recipients', async () => {
    assert.equal(box.balance, 9000)
    const txid = await box.sendMany([
      ['mfjPijd3gNj1Tx7QcdZaSWCEYbxfeVRaxN', 3600],
      ['mgxGAWN13irNZi1B8LdHXc4E8scDaAVRUV', 2600],
    ])
    assert.isString(txid)
    assert.lengthOf(txid, 64)

    assert.lengthOf(box.jigs, 1)
    assert.equal(box.balance, 2800)
  })

  it('throws an error when insufficient balance', async () => {
    const promise = box.sendMany([
      ['mfjPijd3gNj1Tx7QcdZaSWCEYbxfeVRaxN', 13600],
      ['mgxGAWN13irNZi1B8LdHXc4E8scDaAVRUV', 12600],
    ])
    await assert.isRejected(promise, 'Not enough funds')
  })

  it('throws an error with NFT boxes', async () => {
    const klass = await tokenkit.nft.deploy(nftFixture)
    const box = await tokenkit.nft.getJigBox(klass.origin)
    const promise = box.sendMany([
      ['mfjPijd3gNj1Tx7QcdZaSWCEYbxfeVRaxN', 3600],
      ['mgxGAWN13irNZi1B8LdHXc4E8scDaAVRUV', 2600],
    ])
    await assert.isRejected(promise, /^Method unavailable/)
  })
})


describe('JigBox#burn()', () => {
  let box
  beforeEach(async () => {
    const klass = await tokenkit.ft.deploy(ftFixture)
    await tokenkit.ft.mint(klass.origin, [
      [5000, run.owner.address],
      [1000, run.owner.address],
      [3000, run.owner.address],
    ])

    box = await tokenkit.ft.getJigBox(klass.origin)
  })

  it('burns amount of tokens', async () => {
    assert.equal(box.balance, 9000)
    const txid = await box.burn(4000)
    assert.isString(txid)
    assert.lengthOf(txid, 64)

    assert.lengthOf(box.jigs, 1)
    assert.equal(box.balance, 5000)
  })

  it('throws an error when insufficient balance', async () => {
    const promise = box.burn(15000)
    await assert.isRejected(promise, 'Not enough funds')
  })

  it('throws an error with NFT boxes', async () => {
    const klass = await tokenkit.nft.deploy(nftFixture)
    const box = await tokenkit.nft.getJigBox(klass.origin)
    const promise = box.burn(4500)
    await assert.isRejected(promise, /^Method unavailable/)
  })
})


describe('JigBox#sync()', () => {
  it('refreshes the JigBox inventory', async () => {
    const klass = await tokenkit.ft.deploy(ftFixture)
    const box = await tokenkit.ft.getJigBox(klass.origin)

    assert.lengthOf(box.jigs, 0)

    await tokenkit.ft.mint(klass.origin, [
      [5000, run.owner.address],
      [1000, run.owner.address],
      [3000, run.owner.address],
    ])

    await box.sync()
    assert.lengthOf(box.jigs, 3)
  })
})