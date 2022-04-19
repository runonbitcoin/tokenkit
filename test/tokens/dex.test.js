import chai, { assert } from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { run } from '../support/run.js'
import { ftFixture, nftFixture } from '../support/fixtures.js'
import tokenkit from '../../src/index.js'

chai.use(chaiAsPromised)
tokenkit.init(run)

const fixture = {
  address: 'mfjPijd3gNj1Tx7QcdZaSWCEYbxfeVRaxN',
  satoshis: 100000
}


describe('DEX.createOffer() with fungible token', () => {
  let klass, jigbox
  beforeEach(async () => {
    klass = await tokenkit.ft.deploy(ftFixture)

    await tokenkit.ft.mint(klass.origin, [
      [5000, run.owner.address],
    ])

    jigbox = await tokenkit.ft.getJigBox(klass.origin)
  })

  it('creates a sell for a token', async () => {
    const jig = await tokenkit.dex.createOffer({
      ...fixture,
      jigbox,
      amount: 4000,
    })

    assert.instanceOf(jig, jigbox.contract)
    assert.equal(jig.amount, 4000)
    assert.equal(jig.owner.address, 'mfjPijd3gNj1Tx7QcdZaSWCEYbxfeVRaxN')
    assert.equal(jig.owner.satoshis, 100000)
    assert.equal(jig.sender, run.owner.address)
  })

  it('throws error if jigbox is not a JigBox', async () => {
    const promise = tokenkit.dex.createOffer({
      ...fixture,
      jigbox: { foo: 'bar' },
      amount: 4000,
    })
    await assert.isRejected(promise, /^'jigbox' is invalid/)
  })

  it('throws error if amount is not present', async () => {
    const promise = tokenkit.dex.createOffer({
      ...fixture,
      jigbox,
    })
    await assert.isRejected(promise, /jigbox with amount/)
  })

  it('throws error if address is invalid', async () => {
    const promise = tokenkit.dex.createOffer({
      ...fixture,
      jigbox,
      amount: 4000,
      address: 'notanaddress',
    })
    await assert.isRejected(promise, /^'address' is invalid/)
  })

  it('throws error if satoshis is invalid', async () => {
    const promise = tokenkit.dex.createOffer({
      ...fixture,
      jigbox,
      amount: 4000,
      satoshis: 'abc'
    })
    await assert.isRejected(promise, /^'satoshis' is invalid/)
  })
})


describe('DEX.createOffer() with non-fungible token', () => {
  let klass, jigbox
  beforeEach(async () => {
    klass = await tokenkit.nft.deploy(nftFixture)

    await tokenkit.ft.mint(klass.origin, [
      run.owner.address,
    ])

    jigbox = await tokenkit.nft.getJigBox(klass.origin)
  })

  it('creates a sell for a token', async () => {
    const jig = await tokenkit.dex.createOffer({
      ...fixture,
      jig: jigbox.jigs[0],
    })

    assert.instanceOf(jig, jigbox.contract)
    assert.equal(jig.owner.address, 'mfjPijd3gNj1Tx7QcdZaSWCEYbxfeVRaxN')
    assert.equal(jig.owner.satoshis, 100000)
    assert.equal(jig.sender, run.owner.address)
  })

  it('throws error if jigbox is not a JigBox', async () => {
    const promise = tokenkit.dex.createOffer({
      ...fixture,
      jig: { foo: 'bar' },
    })
    await assert.isRejected(promise, /^'jig' is invalid/)
  })

  it('throws error if address is invalid', async () => {
    const promise = tokenkit.dex.createOffer({
      ...fixture,
      jig: jigbox.jigs[0],
      address: 'notanaddress',
    })
    await assert.isRejected(promise, /^'address' is invalid/)
  })

  it('throws error if satoshis is invalid', async () => {
    const promise = tokenkit.dex.createOffer({
      ...fixture,
      jig: jigbox.jigs[0],
      satoshis: 'abc'
    })
    await assert.isRejected(promise, /^'satoshis' is invalid/)
  })
})