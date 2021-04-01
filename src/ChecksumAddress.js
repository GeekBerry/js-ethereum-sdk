/* eslint-disable no-bitwise */
const lodash = require('lodash');
const assert = require('assert');
const JSBI = require('./util/jsbi');
const { convertBit, polyMod } = require('./util/sign');
const { ADDRESS_TYPE } = require('./CONST');

const BYTE_TO_BASE32 = 'ABCDEFGHJKMNPRSTUVWXYZ0123456789';
const BASE32_TO_BYTE = lodash.mapValues(lodash.invert(BYTE_TO_BASE32), Number);

const NULL_ADDRESS_BUFFER = Buffer.alloc(20);
const VERSION_BYTE = 0; // 20 bytes length => version 0

const REGEX = /^(CFX|CFXTEST|NET\d+):TYPE\.(USER|CONTRACT|BUILTIN|NULL):([ABCDEFGHJKMNPRSTUVWXYZ0123456789]{34})([ABCDEFGHJKMNPRSTUVWXYZ0123456789]{8})$/;
const SIMPLE_REGEX = /^(CFX|CFXTEST|NET\d+):([ABCDEFGHJKMNPRSTUVWXYZ0123456789]{34})([ABCDEFGHJKMNPRSTUVWXYZ0123456789]{8})$/;

/**
 * Checksum address by CIP-37
 */
class ChecksumAddress extends String {
  static getType(buffer) {
    if (Buffer.compare(buffer, NULL_ADDRESS_BUFFER) === 0) {
      return ADDRESS_TYPE.NULL;
    }

    switch (buffer[0] & 0xf0) {
      case 0x00:
        return ADDRESS_TYPE.BUILTIN;
      case 0x10:
        return ADDRESS_TYPE.USER;
      case 0x80:
        return ADDRESS_TYPE.CONTRACT;
      default:
        throw new Error(`unexpected address prefix ${buffer.toString('hex')}`);
    }
  }

  /**
   * From object to CIP-37 address
   *
   * @param options {object}
   * @param options.netName {string} - Net name
   * @param options.addressType {string} - Address Type
   * @param options.payload {string} - Base32 address payload
   * @param options.checksum {string} - Base32 address checksum
   * @return {ChecksumAddress}
   *
   * @example
   * > ChecksumAddress.fromObject({
     netName: 'CFX',
     addressType: 'USER',
     payload: 'ACC7UAWF5UBTNMEZVHU9DHC6SGHEA0403Y',
     checksum: '2DGPYFJP',
   })
   "CFX:TYPE.CONTRACT:ACC7UAWF5UBTNMEZVHU9DHC6SGHEA0403Y2DGPYFJP"
   */
  static fromObject({ netName, addressType, payload, checksum }) {
    return new this(`${netName}:TYPE.${addressType}:${payload}${checksum}`);
  }

  /**
   * From simple address string to complete CIP-37 address
   *
   * @param string {string}
   * @return {ChecksumAddress}
   *
   * @example
   * > ChecksumAddress.fromSimple('cfx:acc7uawf5ubtnmezvhu9dhc6sghea0403y2dgpyfjp')
   "CFX:TYPE.CONTRACT:ACC7UAWF5UBTNMEZVHU9DHC6SGHEA0403Y2DGPYFJP"
   */
  static fromSimple(string) {
    assert(lodash.isString(string), `expected a string, got ${string}`);

    const [, netName, payload, checksum] = string.toUpperCase().match(SIMPLE_REGEX) || [];
    const noTypeAddress = this.fromObject({ netName, addressType: ADDRESS_TYPE.NULL, payload, checksum });
    const addressType = this.getType(noTypeAddress.toBuffer());
    return this.fromObject({ netName, addressType, payload, checksum });
  }

  /**
   * From bytes20 address buffer to CIP-37 address
   *
   * @param buffer {Buffer}
   * @param [netName='CFX'] {string}
   * @return {ChecksumAddress}
   *
   * @example
   * > ChecksumAddress.fromBuffer(Buffer.alloc(20))
   'CFX:TYPE.NULL:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA0SFBNJM2'
   */
  static fromBuffer(buffer, netName = 'CFX') {
    assert(Buffer.isBuffer(buffer), `expected buffer to Buffer, got ${buffer}`);
    assert(buffer.length > 0, `buffer.length shuold > 0, got ${buffer.length}`);

    const addressType = this.getType(buffer);

    const netName5Bits = Buffer.from(netName).map(byte => byte & 0b11111);
    const payload5Bits = convertBit([VERSION_BYTE, ...buffer], 8, 5, true);

    const checksumBigInt = polyMod([...netName5Bits, 0, ...payload5Bits, 0, 0, 0, 0, 0, 0, 0, 0]);
    const checksumBytes = Buffer.from(checksumBigInt.toString(16).padStart(10, '0'), 'hex');
    const checksum5Bits = convertBit(checksumBytes, 8, 5, true);

    const payload = payload5Bits.map(byte => BYTE_TO_BASE32[byte]).join('');
    const checksum = checksum5Bits.map(byte => BYTE_TO_BASE32[byte]).join('');
    return this.fromObject({ netName, addressType, payload, checksum });
  }

  /**
   * From hex40 address to CIP-37 address
   *
   * @param hex {string} - Hex 40 address
   * @param [netName] {string} - Net name
   * @return {ChecksumAddress}
   *
   * @example
   * > ChecksumAddress.fromHex('0x0000000000000000000000000000000000000000')
   'CFX:TYPE.NULL:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA0SFBNJM2'

   * > ChecksumAddress.fromHex('0x0000000000000000000000000000000000000000', 'CFXTEST')
   'CFXTEST:TYPE.NULL:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA6F0VRCSW'

   * > ChecksumAddress.fromHex('0x0000000000000000000000000000000000000000', 'NET8')
   'NET8:TYPE.NULL:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABM73N8R6'
   */
  static fromHex(hex, netName) {
    assert(/^0x[0-9a-f]{40}$/.test(hex), 'hex not match regex /0x[0-9a-f]{40}/');

    const addressBytes = Buffer.from(hex.replace('0x', ''), 'hex');
    return this.fromBuffer(addressBytes, netName);
  }

  /**
   * Checksum address by CIP-37
   *
   * @param string {string} - CIP-37 address
   *
   * @example
   * > new ChecksumAddress('CFX:TYPE.USER:AARC9ABYCUE0HHZGYRR53M6CXEDGCCRMMYYBJGH4XG')
   'CFX:TYPE.USER:AARC9ABYCUE0HHZGYRR53M6CXEDGCCRMMYYBJGH4XG'

   * > ChecksumAddress('CFX:TYPE.CONTRACT:ACC7UAWF5UBTNMEZVHU9DHC6SGHEA0403Y2DGPYFJP') // without `new`
   'CFX:TYPE.CONTRACT:ACC7UAWF5UBTNMEZVHU9DHC6SGHEA0403Y2DGPYFJP'
   */
  constructor(string) {
    assert(lodash.isString(string), `expected a string, got ${string}`);

    const uppercase = string.toUpperCase();
    assert(REGEX.test(uppercase), `string "${string}" not match regex ${REGEX}`);
    super(uppercase);
  }

  /**
   * Return address checksum is valid
   *
   * @return {boolean}
   * @example
   * > ChecksumAddress('CFX:TYPE.NULL:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA0SFBNJM2').isValid()
   true

   * > ChecksumAddress('CFX:TYPE.NULL:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA0SFBNJM3').isValid()
   false
   */
  isValid() {
    const { netName, payload, checksum } = this.toObject();

    const prefix5Bits = Buffer.from(netName).map(byte => byte & 0b11111);
    const payload5Bits = lodash.map(payload, char => BASE32_TO_BYTE[char]);
    const checksum5Bits = lodash.map(checksum, char => BASE32_TO_BYTE[char]);

    const bigInt = polyMod([...prefix5Bits, 0, ...payload5Bits, ...checksum5Bits]);
    return JSBI.equal(bigInt, JSBI.BigInt(0));
  }

  /**
   * Inverse operation of `ChecksumAddress.fromObject`
   *
   * @return {object}
   *
   * @example
   * > ChecksumAddress('CFX:TYPE.NULL:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA0SFBNJM2').toObject()
   {
      netName: 'CFX',
      addressType: 'NULL',
      payload: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      checksum: '0SFBNJM2',
   }
   */
  toObject() {
    const [, netName, addressType, payload, checksum] = this.match(REGEX) || [];
    return { netName, addressType, payload, checksum };
  }

  /**
   * Inverse operation of `ChecksumAddress.fromSimple`
   *
   * @return {string}
   *
   * @example
   * > ChecksumAddress('CFX:TYPE.NULL:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA0SFBNJM2').toSimple()
   'cfx:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa0sfbnjm2'
   */
  toSimple() {
    const { netName, payload, checksum } = this.toObject();
    return `${netName}:${payload}${checksum}`.toLowerCase();
  }

  /**
   * Inverse operation of `ChecksumAddress.fromBuffer`
   *
   * @return {Buffer}
   *
   * @example
   * > ChecksumAddress('CFX:TYPE.NULL:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA0SFBNJM2').toBuffer()
   <Buffer 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00>
   */
  toBuffer() {
    const { payload } = this.toObject();
    const payload5Bits = lodash.map(payload, char => BASE32_TO_BYTE[char]);
    const [version, ...addressBytes] = convertBit(payload5Bits, 5, 8);
    assert(version === VERSION_BYTE);

    return Buffer.from(addressBytes);
  }

  /**
   * Inverse operation of `ChecksumAddress.fromHex`
   *
   * @return {string}
   *
   * @example
   * > ChecksumAddress('CFX:TYPE.BUILTIN:AAEJUAAAAAAAAAAAAAAAAAAAAAAAAAAAAJRWUC9JNB').toHex()
   '0x0888000000000000000000000000000000000002'
   */
  toHex() {
    return `0x${this.toBuffer().toString('hex')}`;
  }
}

module.exports = new Proxy(ChecksumAddress, {
  apply(target, thisArg, argArray) {
    return new ChecksumAddress(...argArray);
  },
});
