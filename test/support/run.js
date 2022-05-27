import Run from 'run-sdk'

export const run = new Run({ network: 'mock', trust: 'state' })

run.blockchain.fund(run.purse.address, 1000000000000)

// TODO: Use nimble.
// Disable bsv1 script verification because the OP_PUSH_TX tests fail due to bug
import bsv from 'bsv'
bsv.Script.Interpreter.prototype.verify = () => true

async function preCacheState(state) {
  for (const key of Object.keys(state)) {
    const cached = await run.cache.get(key)
    if (!cached) {
      await run.cache.set(key, state[key])
    }
  }
}

const state = {
  "jig://d6170025a62248d8df6dc14e3806e68b8df3d804c800c7bfb23b0b4232862505_o1":{
     "kind":"code",
     "props":{
        "deps":{
           "Base58":{
              "$jig":"81bcef29b0e4ed745f3422c0b764a33c76d0368af2d2e7dd139db8e00ee3d8a6_o1"
           },
           "Hex":{
              "$jig":"727e7b423b7ee40c0b5be87fba7fa5673ea2d20a74259040a7295d9c32a90011_o1"
           },
           "asm":{
              "$jig":"49145693676af7567ebe20671c5cb01369ac788c20f3b1c804f624a1eda18f3f_o1"
           },
           "sha256":{
              "$jig":"3b7ef411185bbe3d01caeadbe6f115b0103a546c4ef0ac7474aa6fbb71aff208_o1"
           }
        },
        "location":"_o1",
        "nonce":1,
        "origin":"_o1",
        "owner":"1Ne4Bd76Hr88R3YKYWejW164DDE7EEGjPX",
        "satoshis":0,
        "scriptTemplate":"20000000000000000000000000000000000000000000000000000000000000000001c35279630142517a75547901687f7501447f77007901207f7504000000007e517951797e56797eaa577901247f75547f77876975756754795579827758947f75557982770128947f77527987696861547921cdb285cc49e5ff3eed6536e7b426e8a528b05bf9276bd05431a671743e651ceb002102dca1e194dd541a47f4c85fea6a4d45bb50f16ed2fddc391bf80b525454f8b40920f941a26b1c1802eaa09109701e4e632e1ef730b0b68c9517e7c19be2ba4c7d37202f282d163597a82d72c263b004695297aecb4d758dccd1dbf61e82a3360bde2c202cde0b36a3821ef6dbd1cc8d754dcbae97526904b063c2722da89735162d282f56795679aa616100790079517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e01007e81517a756157795679567956795679537956795479577995939521414136d08c5ed2bf3ba048afe6dcaebafeffffffffffffffffffffffffffffff0061517951795179517997527a75517a5179009f635179517993527a75517a685179517a75517a7561527a75517a517951795296a0630079527994527a75517a68537982775279827754527993517993013051797e527e53797e57797e527e52797e5579517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7e56797e0079517a75517a75517a75517a75517a75517a75517a75517a75517a75517a75517a75517a756100795779ac517a75517a75517a75517a75517a75517a75517a75517a75517a75617777777777",
        "scrypt":"contract OrderLock {\n  // double hash of designated output, i.e. hash256(satoshis + varint + output script)\n  Sha256 hashOutput;\n\n  // trailingPrevouts = concat all inputs (txid1 + vout1 + txid2 + vout2 + ...),\n  // excluding first 2 inputs, i.e. cancel baton input and self input\n  public function unlock(SigHashPreimage preimage, bytes trailingPrevouts, bool isCancel) {\n      // c3 = SIGHASH_SINGLE | ANYONECANPAY, checks self input, self output\n      SigHashType sigHashType = SigHashType(b'c3');\n      if (isCancel) {\n          // 42 = SIGHASH_NONE, checks all inputs, no outputs\n          sigHashType = SigHashType(b'42');\n          // token lock input txid + vout, 32 + 4 bytes\n          bytes selfOutpoint = preimage[68 : 104];\n          // cancel baton input, same locking tx as token lock input, vout must be 0\n          bytes cancelOutpoint = selfOutpoint[: 32] + b'00000000';\n          // reconstruct full prevouts, double hash, check against preimage hashPrevouts\n          require(hash256(selfOutpoint + cancelOutpoint + trailingPrevouts) == preimage[4 : 36]);\n      } else {\n          // check against preimage hashOutputs, with SIGHASH_SINGLE, only self output is hashed\n          require(preimage[len(preimage) - 40 : len(preimage) - 8] == this.hashOutput);\n      }\n      // check preimage\n      require(Tx.checkPreimageAdvanced(\n          preimage,\n          PrivKey(0xeb1c653e7471a63154d06b27f95bb028a5e826b4e73665ed3effe549cc85b2cd),\n          PubKey(b'02dca1e194dd541a47f4c85fea6a4d45bb50f16ed2fddc391bf80b525454f8b409'),\n          0x377d4cbae29bc1e717958cb6b030f71e2e634e1e700991a0ea02181c6ba241f9,\n          0x2cde0b36a3821ef6dbd1cc8d754dcbae97526904b063c2722da89735162d282f,\n          b'2cde0b36a3821ef6dbd1cc8d754dcbae97526904b063c2722da89735162d282f',\n          sigHashType\n      ));\n  }\n}",
        "sealed":true,
        "upgradable":false
     },
     "src":"class OrderLock {\r\n  constructor(address, satoshis) {\r\n    if (typeof address !== \"string\" || address.length < 27) {\r\n      throw new TypeError(\"Invalid address\");\r\n    }\r\n    if (typeof satoshis !== \"number\" || !Number.isInteger(satoshis)) {\r\n      throw new Error(\"Invalid satoshis\");\r\n    }\r\n    if (satoshis > Number.MAX_SAFE_INTEGER) {\r\n      throw new Error(\"Invalid. Max: \" + Number.MAX_SAFE_INTEGER);\r\n    }\r\n    if (satoshis < 546) {\r\n      throw new Error(\"Dust\");\r\n    }\r\n    this.address = address;\r\n    this.satoshis = satoshis;\r\n  }\r\n  script() {\r\n    const output = this.serializeOutput(this.address, this.satoshis);\r\n    const hashOutput = this.sha256sha256(output);\r\n    return (\r\n      OrderLock.scriptTemplate.slice(0, 2) +\r\n      hashOutput +\r\n      OrderLock.scriptTemplate.slice(66)\r\n    );\r\n  }\r\n  serializeOutput(address, satoshis) {\r\n    const satoshisHex = this.serializeSatoshis(satoshis);\r\n    const satoshisHexBytes = Hex.stringToBytes(satoshisHex);\r\n    const outputScriptBytes = Hex.stringToBytes(this.getP2PKHScript(address));\r\n    const lengthBytes = [25];\r\n    return satoshisHexBytes.concat(lengthBytes, outputScriptBytes);\r\n  }\r\n  serializeSatoshis(satoshis) {\r\n    let numberHex = (\"0000000000000000\" + satoshis.toString(16)).slice(-16);\r\n    return numberHex\r\n      .match(/[a-fA-F0-9]{2}/g)\r\n      .reverse()\r\n      .join(\"\");\r\n  }\r\n  getP2PKHScript(address) {\r\n    const decoded = Base58.decode(address);\r\n    const hex = Hex.bytesToString(decoded);\r\n    return asm(`OP_DUP OP_HASH160 ${hex} OP_EQUALVERIFY OP_CHECKSIG`);\r\n  }\r\n  sha256sha256(output) {\r\n    return Hex.bytesToString(sha256(sha256(output)));\r\n  }\r\n  domain() {\r\n    return 0;\r\n  }\r\n}",
     "version":"04"
  },
  "jig://81bcef29b0e4ed745f3422c0b764a33c76d0368af2d2e7dd139db8e00ee3d8a6_o1":{
     "kind":"code",
     "props":{
        "deps":{
           
        },
        "location":"_o1",
        "nonce":1,
        "origin":"_o1",
        "owner":"1PytriYokKN3GpKw84L4vvrGBwUvTYzCpx",
        "satoshis":0
     },
     "src":"class Base58 {\n  static decode (s) {\n    // Based on https://gist.github.com/diafygi/90a3e80ca1c2793220e5/\n    if (typeof s !== 'string') throw new Error(`Cannot decode: ${s}`)\n    const A = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'\n    const d = [] // the array for storing the stream of decoded bytes\n    const b = [] // the result byte array that will be returned\n    let j // the iterator variable for the byte array (d)\n    let c // the carry amount variable that is used to overflow from the current byte to the next byte\n    let n // a temporary placeholder variable for the current byte\n    for (let i = 0; i < s.length; i++) {\n      j = 0 // reset the byte iterator\n      c = A.indexOf(s[i]) // set the initial carry amount equal to the current base58 digit\n      if (c < 0) throw new Error(`Invalid base58 character: ${s}\\n\\nDetails: i=${i}, c=${s[i]}`)\n      if (!(c || b.length ^ i)) b.push(0) // prepend the result array with a zero if the base58 digit is zero and non-zero characters haven't been seen yet (to ensure correct decode length)\n      while (j in d || c) { // start looping through the bytes until there are no more bytes and no carry amount\n        n = d[j] // set the placeholder for the current byte\n        n = n ? n * 58 + c : c // shift the current byte 58 units and add the carry amount (or just add the carry amount if this is a new byte)\n        c = n >> 8 // find the new carry amount (1-byte shift of current byte value)\n        d[j] = n % 256 // reset the current byte to the remainder (the carry amount will pass on the overflow)\n        j++ // iterate to the next byte\n      }\n    }\n    while (j--) { b.push(d[j]) } // since the byte array is backwards, loop through it in reverse order, and append\n    if (b.length < 5) throw new Error(`Base58 string too short: ${s}`)\n    // We assume the checksum and version are correct\n    return b.slice(1, b.length - 4)\n  }\n}",
     "version":"04"
  },
  "jig://727e7b423b7ee40c0b5be87fba7fa5673ea2d20a74259040a7295d9c32a90011_o1":{
     "kind":"code",
     "props":{
        "deps":{
           
        },
        "location":"_o1",
        "nonce":1,
        "origin":"_o1",
        "owner":"1PytriYokKN3GpKw84L4vvrGBwUvTYzCpx",
        "satoshis":0
     },
     "src":"class Hex {\n  static stringToBytes (s) {\n    if (typeof s !== 'string' || s.length % 2 !== 0) {\n      throw new Error(`Bad hex: ${s}`)\n    }\n\n    s = s.toLowerCase()\n\n    const HEX_CHARS = '0123456789abcdef'.split('')\n    const bytes = []\n\n    for (let i = 0; i < s.length; i += 2) {\n      const high = HEX_CHARS.indexOf(s[i])\n      const low = HEX_CHARS.indexOf(s[i + 1])\n\n      if (high === -1 || low === -1) {\n        throw new Error(`Bad hex: ${s}`)\n      }\n\n      bytes.push(high * 16 + low)\n    }\n\n    return bytes\n  }\n\n  static bytesToString (b) {\n    if (!Array.isArray(b)) throw new Error(`Bad bytes: ${b}`)\n\n    const validDigit = x => Number.isInteger(x) && x >= 0 && x < 256\n    b.forEach(x => { if (!validDigit(x)) throw new Error(`Bad digit: ${x}`) })\n\n    return b\n      .map(x => x.toString('16'))\n      .map(x => x.length === 1 ? '0' + x : x)\n      .join('')\n  }\n}",
     "version":"04"
  },
  "jig://49145693676af7567ebe20671c5cb01369ac788c20f3b1c804f624a1eda18f3f_o1":{
     "kind":"code",
     "props":{
        "OP_CODES":{
           "OP_0":0,
           "OP_0NOTEQUAL":146,
           "OP_1":81,
           "OP_10":90,
           "OP_11":91,
           "OP_12":92,
           "OP_13":93,
           "OP_14":94,
           "OP_15":95,
           "OP_16":96,
           "OP_1ADD":139,
           "OP_1NEGATE":79,
           "OP_1SUB":140,
           "OP_2":82,
           "OP_2DROP":109,
           "OP_2DUP":110,
           "OP_2OVER":112,
           "OP_2ROT":113,
           "OP_2SWAP":114,
           "OP_3":83,
           "OP_3DUP":111,
           "OP_4":84,
           "OP_5":85,
           "OP_6":86,
           "OP_7":87,
           "OP_8":88,
           "OP_9":89,
           "OP_ABS":144,
           "OP_ADD":147,
           "OP_AND":132,
           "OP_BIN2NUM":129,
           "OP_BOOLAND":154,
           "OP_BOOLOR":155,
           "OP_CAT":126,
           "OP_CHECKMULTISIG":174,
           "OP_CHECKMULTISIGVERIFY":175,
           "OP_CHECKSIG":172,
           "OP_CHECKSIGVERIFY":173,
           "OP_CODESEPARATOR":171,
           "OP_DEPTH":116,
           "OP_DIV":150,
           "OP_DROP":117,
           "OP_DUP":118,
           "OP_ELSE":103,
           "OP_ENDIF":104,
           "OP_EQUAL":135,
           "OP_EQUALVERIFY":136,
           "OP_FALSE":0,
           "OP_FROMALTSTACK":108,
           "OP_GREATERTHAN":160,
           "OP_GREATERTHANOREQUAL":162,
           "OP_HASH160":169,
           "OP_HASH256":170,
           "OP_IF":99,
           "OP_IFDUP":115,
           "OP_INVALIDOPCODE":255,
           "OP_INVERT":131,
           "OP_LESSTHAN":159,
           "OP_LESSTHANOREQUAL":161,
           "OP_LSHIFT":152,
           "OP_MAX":164,
           "OP_MIN":163,
           "OP_MOD":151,
           "OP_MUL":149,
           "OP_NEGATE":143,
           "OP_NIP":119,
           "OP_NOP":97,
           "OP_NOP1":176,
           "OP_NOP10":185,
           "OP_NOP2":177,
           "OP_NOP3":178,
           "OP_NOP4":179,
           "OP_NOP5":180,
           "OP_NOP6":181,
           "OP_NOP7":182,
           "OP_NOP8":183,
           "OP_NOP9":184,
           "OP_NOT":145,
           "OP_NOTIF":100,
           "OP_NUM2BIN":128,
           "OP_NUMEQUAL":156,
           "OP_NUMEQUALVERIFY":157,
           "OP_NUMNOTEQUAL":158,
           "OP_OR":133,
           "OP_OVER":120,
           "OP_PICK":121,
           "OP_PUBKEY":254,
           "OP_PUBKEYHASH":253,
           "OP_PUSHDATA1":76,
           "OP_PUSHDATA2":77,
           "OP_PUSHDATA4":78,
           "OP_RETURN":106,
           "OP_RIPEMD160":166,
           "OP_ROLL":122,
           "OP_ROT":123,
           "OP_RSHIFT":153,
           "OP_SHA1":167,
           "OP_SHA256":168,
           "OP_SIZE":130,
           "OP_SPLIT":127,
           "OP_SUB":148,
           "OP_SWAP":124,
           "OP_TOALTSTACK":107,
           "OP_TRUE":81,
           "OP_TUCK":125,
           "OP_VERIFY":105,
           "OP_WITHIN":165,
           "OP_XOR":134
        },
        "deps":{
           "Hex":{
              "$jig":"727e7b423b7ee40c0b5be87fba7fa5673ea2d20a74259040a7295d9c32a90011_o1"
           }
        },
        "location":"_o1",
        "nonce":2,
        "origin":"61e1265acb3d93f1bf24a593d70b2a6b1c650ec1df90ddece8d6954ae3cdd915_o1",
        "owner":"1PytriYokKN3GpKw84L4vvrGBwUvTYzCpx",
        "satoshis":0
     },
     "src":"function asm (s) {\n  const parts = s.split(' ')\n  let out = []\n\n  for (const part of parts) {\n    // If one of our predefined op-codes\n    if (typeof asm.OP_CODES[part] !== 'undefined') {\n      out.push(asm.OP_CODES[part])\n      continue\n    }\n\n    // Hex data\n    const bytes = Hex.stringToBytes(part.length === 1 ? '0' + part : part)\n\n    // OP_0\n    if (bytes.length === 1 && bytes[0] === 0) {\n      out.push(bytes[0]) // OP_0\n      continue\n    }\n\n    // OP_1-OP_16\n    if (bytes.length === 1 && bytes[0] >= 1 && bytes[0] <= 16) {\n      out.push(bytes[0] + 0x50)\n      continue\n    }\n\n    // OP_PUSH+[1-75] <bytes>\n    if (bytes.length <= 75) {\n      out = out.concat(bytes.length).concat(bytes)\n      continue\n    }\n\n    // OP_PUSHDATA1 <len> <bytes>\n    if (bytes.length < 256) {\n      out = out.concat(asm.OP_CODES.OP_PUSHDATA1).concat([bytes.length]).concat(bytes)\n      continue\n    }\n\n    const floor = x => parseInt(x.toString(), 10)\n\n    // OP_PUSHDATA2 <len> <bytes>\n    if (bytes.length < 256 * 256) {\n      const len = [floor(bytes.length / 256), bytes.length % 256]\n      out = out.concat(asm.OP_CODES.OP_PUSHDATA2).concat(len).concat(bytes)\n      continue\n    }\n\n    // OP_PUSHDATA4 <len> <bytes>\n    const len = [\n      floor(bytes.length / 256 / 256 / 256),\n      floor(bytes.length / 256 / 256) % 256,\n      floor(bytes.length / 256) % 256,\n      bytes.length % 256\n    ]\n    out = out.concat(asm.OP_CODES.OP_PUSHDATA4).concat(len).concat(bytes)\n    continue\n  }\n\n  return Hex.bytesToString(out)\n}",
     "version":"04"
  },
  "jig://3b7ef411185bbe3d01caeadbe6f115b0103a546c4ef0ac7474aa6fbb71aff208_o1":{
     "kind":"code",
     "props":{
        "deps":{
           
        },
        "location":"_o1",
        "nonce":1,
        "origin":"_o1",
        "owner":"1PytriYokKN3GpKw84L4vvrGBwUvTYzCpx",
        "satoshis":0
     },
     "src":"function sha256 (message) {\n  if (!Array.isArray(message)) throw new Error(`Invalid bytes: ${message}`)\n\n  // Based off https://github.com/emn178/js-sha256/blob/master/src/sha256.js\n\n  const EXTRA = [-2147483648, 8388608, 32768, 128]\n  const SHIFT = [24, 16, 8, 0]\n  const K = [\n    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,\n    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,\n    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,\n    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,\n    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,\n    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,\n    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,\n    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2\n  ]\n\n  const blocks = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]\n\n  let h0 = 0x6a09e667\n  let h1 = 0xbb67ae85\n  let h2 = 0x3c6ef372\n  let h3 = 0xa54ff53a\n  let h4 = 0x510e527f\n  let h5 = 0x9b05688c\n  let h6 = 0x1f83d9ab\n  let h7 = 0x5be0cd19\n\n  let block = 0\n  let start = 0\n  let bytes = 0\n  let hBytes = 0\n  let first = true\n  let hashed = false\n  let lastByteIndex = 0\n\n  update()\n  finalize()\n  return digest()\n\n  function update () {\n    let i\n    let index = 0\n    const length = message.length\n\n    while (index < length) {\n      if (hashed) {\n        hashed = false\n        blocks[0] = block\n        blocks[16] = blocks[1] = blocks[2] = blocks[3] =\n                blocks[4] = blocks[5] = blocks[6] = blocks[7] =\n                blocks[8] = blocks[9] = blocks[10] = blocks[11] =\n                blocks[12] = blocks[13] = blocks[14] = blocks[15] = 0\n      }\n\n      for (i = start; index < length && i < 64; ++index) {\n        blocks[i >> 2] |= message[index] << SHIFT[i++ & 3]\n      }\n\n      lastByteIndex = i\n      bytes += i - start\n      if (i >= 64) {\n        block = blocks[16]\n        start = i - 64\n        hash()\n        hashed = true\n      } else {\n        start = i\n      }\n    }\n\n    if (bytes > 4294967295) {\n      hBytes += bytes / 4294967296 << 0\n      bytes = bytes % 4294967296\n    }\n  }\n\n  function finalize () {\n    blocks[16] = block\n    blocks[lastByteIndex >> 2] |= EXTRA[lastByteIndex & 3]\n    block = blocks[16]\n    if (lastByteIndex >= 56) {\n      if (!hashed) {\n        hash()\n      }\n      blocks[0] = block\n      blocks[16] = blocks[1] = blocks[2] = blocks[3] =\n            blocks[4] = blocks[5] = blocks[6] = blocks[7] =\n            blocks[8] = blocks[9] = blocks[10] = blocks[11] =\n            blocks[12] = blocks[13] = blocks[14] = blocks[15] = 0\n    }\n    blocks[14] = hBytes << 3 | bytes >>> 29\n    blocks[15] = bytes << 3\n    hash()\n  }\n\n  function hash () {\n    let a = h0\n    let b = h1\n    let c = h2\n    let d = h3\n    let e = h4\n    let f = h5\n    let g = h6\n    let h = h7\n    let j\n    let s0\n    let s1\n    let maj\n    let t1\n    let t2\n    let ch\n    let ab\n    let da\n    let cd\n    let bc\n\n    for (j = 16; j < 64; ++j) {\n      t1 = blocks[j - 15]\n      s0 = ((t1 >>> 7) | (t1 << 25)) ^ ((t1 >>> 18) | (t1 << 14)) ^ (t1 >>> 3)\n      t1 = blocks[j - 2]\n      s1 = ((t1 >>> 17) | (t1 << 15)) ^ ((t1 >>> 19) | (t1 << 13)) ^ (t1 >>> 10)\n      blocks[j] = blocks[j - 16] + s0 + blocks[j - 7] + s1 << 0\n    }\n\n    bc = b & c\n    for (j = 0; j < 64; j += 4) {\n      if (first) {\n        ab = 704751109\n        t1 = blocks[0] - 210244248\n        h = t1 - 1521486534 << 0\n        d = t1 + 143694565 << 0\n        first = false\n      } else {\n        s0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10))\n        s1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7))\n        ab = a & b\n        maj = ab ^ (a & c) ^ bc\n        ch = (e & f) ^ (~e & g)\n        t1 = h + s1 + ch + K[j] + blocks[j]\n        t2 = s0 + maj\n        h = d + t1 << 0\n        d = t1 + t2 << 0\n      }\n      s0 = ((d >>> 2) | (d << 30)) ^ ((d >>> 13) | (d << 19)) ^ ((d >>> 22) | (d << 10))\n      s1 = ((h >>> 6) | (h << 26)) ^ ((h >>> 11) | (h << 21)) ^ ((h >>> 25) | (h << 7))\n      da = d & a\n      maj = da ^ (d & b) ^ ab\n      ch = (h & e) ^ (~h & f)\n      t1 = g + s1 + ch + K[j + 1] + blocks[j + 1]\n      t2 = s0 + maj\n      g = c + t1 << 0\n      c = t1 + t2 << 0\n      s0 = ((c >>> 2) | (c << 30)) ^ ((c >>> 13) | (c << 19)) ^ ((c >>> 22) | (c << 10))\n      s1 = ((g >>> 6) | (g << 26)) ^ ((g >>> 11) | (g << 21)) ^ ((g >>> 25) | (g << 7))\n      cd = c & d\n      maj = cd ^ (c & a) ^ da\n      ch = (g & h) ^ (~g & e)\n      t1 = f + s1 + ch + K[j + 2] + blocks[j + 2]\n      t2 = s0 + maj\n      f = b + t1 << 0\n      b = t1 + t2 << 0\n      s0 = ((b >>> 2) | (b << 30)) ^ ((b >>> 13) | (b << 19)) ^ ((b >>> 22) | (b << 10))\n      s1 = ((f >>> 6) | (f << 26)) ^ ((f >>> 11) | (f << 21)) ^ ((f >>> 25) | (f << 7))\n      bc = b & c\n      maj = bc ^ (b & d) ^ cd\n      ch = (f & g) ^ (~f & h)\n      t1 = e + s1 + ch + K[j + 3] + blocks[j + 3]\n      t2 = s0 + maj\n      e = a + t1 << 0\n      a = t1 + t2 << 0\n    }\n\n    h0 = h0 + a << 0\n    h1 = h1 + b << 0\n    h2 = h2 + c << 0\n    h3 = h3 + d << 0\n    h4 = h4 + e << 0\n    h5 = h5 + f << 0\n    h6 = h6 + g << 0\n    h7 = h7 + h << 0\n  }\n\n  function digest () {\n    return [\n      (h0 >> 24) & 0xFF, (h0 >> 16) & 0xFF, (h0 >> 8) & 0xFF, h0 & 0xFF,\n      (h1 >> 24) & 0xFF, (h1 >> 16) & 0xFF, (h1 >> 8) & 0xFF, h1 & 0xFF,\n      (h2 >> 24) & 0xFF, (h2 >> 16) & 0xFF, (h2 >> 8) & 0xFF, h2 & 0xFF,\n      (h3 >> 24) & 0xFF, (h3 >> 16) & 0xFF, (h3 >> 8) & 0xFF, h3 & 0xFF,\n      (h4 >> 24) & 0xFF, (h4 >> 16) & 0xFF, (h4 >> 8) & 0xFF, h4 & 0xFF,\n      (h5 >> 24) & 0xFF, (h5 >> 16) & 0xFF, (h5 >> 8) & 0xFF, h5 & 0xFF,\n      (h6 >> 24) & 0xFF, (h6 >> 16) & 0xFF, (h6 >> 8) & 0xFF, h6 & 0xFF,\n      (h7 >> 24) & 0xFF, (h7 >> 16) & 0xFF, (h7 >> 8) & 0xFF, h7 & 0xFF\n    ]\n  }\n}",
     "version":"04"
  }
}

before(async () => {
  await preCacheState(state)
})
