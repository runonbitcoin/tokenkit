import Run from 'run-sdk'

export class OrderLock {
  constructor(address, satoshis) {
    if (typeof address !== "string" || address.length < 27) {
      throw new TypeError("Invalid address");
    }
    if (typeof satoshis !== "number" || !Number.isInteger(satoshis)) {
      throw new Error("Invalid satoshis");
    }
    if (satoshis > Number.MAX_SAFE_INTEGER) {
      throw new Error("Invalid. Max: " + Number.MAX_SAFE_INTEGER);
    }
    if (satoshis < 546) {
      throw new Error("Dust");
    }
    this.address = address;
    this.satoshis = satoshis;
  }
  script() {
    const output = this.serializeOutput(this.address, this.satoshis);
    const hashOutput = this.sha256sha256(output);
    return (
      OrderLock.scriptTemplate.slice(0, 2) +
      hashOutput +
      OrderLock.scriptTemplate.slice(66)
    );
  }
  serializeOutput(address, satoshis) {
    const satoshisHex = this.serializeSatoshis(satoshis);
    const satoshisHexBytes = Hex.stringToBytes(satoshisHex);
    const outputScriptBytes = Hex.stringToBytes(this.getP2PKHScript(address));
    const lengthBytes = [25];
    return satoshisHexBytes.concat(lengthBytes, outputScriptBytes);
  }
  serializeSatoshis(satoshis) {
    let numberHex = ("0000000000000000" + satoshis.toString(16)).slice(-16);
    return numberHex
      .match(/[a-fA-F0-9]{2}/g)
      .reverse()
      .join("");
  }
  getP2PKHScript(address) {
    const decoded = Base58.decode(address);
    const hex = Hex.bytesToString(decoded);
    return asm(`OP_DUP OP_HASH160 ${hex} OP_EQUALVERIFY OP_CHECKSIG`);
  }
  sha256sha256(output) {
    return Hex.bytesToString(sha256(sha256(output)));
  }
  domain() {
    return 0;
  }
}

OrderLock.sealed = true
OrderLock.upgradable = false

OrderLock.scriptTemplate = '20000000000000000000000000000000000000000000000000000000000000000001c35279630142517a75547901687f7501447f77007901207f7504000000007e517951797e56797eaa577901247f75547f77876975756754795579827758947f75557982770128947f77527987696861547921cdb285cc49e5ff3eed6536e7b426e8a528b05bf9276bd05431a671743e651ceb002102dca1e194dd541a47f4c85fea6a4d45bb50f16ed2fddc391bf80b525454f8b40920f941a26b1c1802eaa09109701e4e632e1ef730b0b68c9517e7c19be2ba4c7d37202f282d163597a82d72c263b004695297aecb4d758dccd1dbf61e82a3360bde2c202cde0b36a3821ef6dbd1cc8d754dcbae97526904b063c2722da89735162d282f56795679aa616100790079517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e01007e81517a756157795679567956795679537956795479577995939521414136d08c5ed2bf3ba048afe6dcaebafeffffffffffffffffffffffffffffff0061517951795179517997527a75517a5179009f635179517993527a75517a685179517a75517a7561527a75517a517951795296a0630079527994527a75517a68537982775279827754527993517993013051797e527e53797e57797e527e52797e5579517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7e56797e0079517a75517a75517a75517a75517a75517a75517a75517a75517a75517a75517a75517a756100795779ac517a75517a75517a75517a75517a75517a75517a75517a75517a75617777777777'

OrderLock.deps = {
  Base58: Run.extra.Base58,
  Hex: Run.extra.Hex,
  asm: Run.extra.asm,
  sha256: Run.extra.sha256,
}
