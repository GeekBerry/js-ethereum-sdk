const { format, ChecksumAddress } = require('../src');

test('constructor', () => {
  expect(() => ChecksumAddress()).toThrow('expected a string');
  expect(() => ChecksumAddress('')).toThrow('not match regex');

  expect((new ChecksumAddress('CFX:TYPE.USER:AARC9ABYCUE0HHZGYRR53M6CXEDGCCRMMYYBJGH4XG')).toString())
    .toEqual('CFX:TYPE.USER:AARC9ABYCUE0HHZGYRR53M6CXEDGCCRMMYYBJGH4XG');

  expect(ChecksumAddress('CFX:TYPE.USER:AARC9ABYCUE0HHZGYRR53M6CXEDGCCRMMYYBJGH4XG').toString())
    .toEqual('CFX:TYPE.USER:AARC9ABYCUE0HHZGYRR53M6CXEDGCCRMMYYBJGH4XG');

  expect(ChecksumAddress('cfx:type.user:aarc9abycue0hhzgyrr53m6cxedgccrmmyybjgh4xg').toString())
    .toEqual('CFX:TYPE.USER:AARC9ABYCUE0HHZGYRR53M6CXEDGCCRMMYYBJGH4XG');
});

test('fromHex', () => {
  // NULL
  expect(ChecksumAddress.fromHex('0x0000000000000000000000000000000000000000').toString())
    .toEqual('CFX:TYPE.NULL:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA0SFBNJM2');

  expect(ChecksumAddress.fromHex('0x0000000000000000000000000000000000000000', 'CFXTEST').toString())
    .toEqual('CFXTEST:TYPE.NULL:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA6F0VRCSW');

  expect(ChecksumAddress.fromHex('0x0000000000000000000000000000000000000000', 'NET8').toString())
    .toEqual('NET8:TYPE.NULL:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABM73N8R6');

  // BUILDIN
  expect(ChecksumAddress.fromHex('0x0888000000000000000000000000000000000002').toString())
    .toEqual('CFX:TYPE.BUILTIN:AAEJUAAAAAAAAAAAAAAAAAAAAAAAAAAAAJRWUC9JNB');

  expect(ChecksumAddress.fromHex('0x0888000000000000000000000000000000000002', 'CFXTEST').toString())
    .toEqual('CFXTEST:TYPE.BUILTIN:AAEJUAAAAAAAAAAAAAAAAAAAAAAAAAAAAJH3DW3CTN');

  // USER
  expect(ChecksumAddress.fromHex('0x1a2f80341409639ea6a35bbcab8299066109aa55').toString())
    .toEqual('CFX:TYPE.USER:AARC9ABYCUE0HHZGYRR53M6CXEDGCCRMMYYBJGH4XG');

  expect(ChecksumAddress.fromHex('0x1a2f80341409639ea6a35bbcab8299066109aa55', 'CFXTEST').toString())
    .toEqual('CFXTEST:TYPE.USER:AARC9ABYCUE0HHZGYRR53M6CXEDGCCRMMY8M50BU1P');

  // CONTRACT
  expect(ChecksumAddress.fromHex('0x85d80245dc02f5a89589e1f19c5c718e405b56cd').toString())
    .toEqual('CFX:TYPE.CONTRACT:ACC7UAWF5UBTNMEZVHU9DHC6SGHEA0403Y2DGPYFJP');

  expect(ChecksumAddress.fromHex('0x85d80245dc02f5a89589e1f19c5c718e405b56cd', 'CFXTEST').toString())
    .toEqual('CFXTEST:TYPE.CONTRACT:ACC7UAWF5UBTNMEZVHU9DHC6SGHEA0403YWJZ6WTPG');

  expect(() => ChecksumAddress.fromHex(null)).toThrow('hex not match regex');
  expect(() => ChecksumAddress.fromHex('0x00000000000000000000000000000000000000'))
    .toThrow('hex not match regex');
  expect(() => ChecksumAddress.fromHex('0x2000000000000000000000000000000000000000'))
    .toThrow('unexpected address prefix');
});

test('fromSimple', () => {
  expect(ChecksumAddress.fromSimple('cfx:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa0sfbnjm2').toString())
    .toEqual('CFX:TYPE.NULL:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA0SFBNJM2');

  expect(ChecksumAddress.fromSimple('cfx:aaejuaaaaaaaaaaaaaaaaaaaaaaaaaaaajrwuc9jnb').toString())
    .toEqual('CFX:TYPE.BUILTIN:AAEJUAAAAAAAAAAAAAAAAAAAAAAAAAAAAJRWUC9JNB');

  expect(ChecksumAddress.fromSimple('cfx:aarc9abycue0hhzgyrr53m6cxedgccrmmyybjgh4xg').toString())
    .toEqual('CFX:TYPE.USER:AARC9ABYCUE0HHZGYRR53M6CXEDGCCRMMYYBJGH4XG');

  expect(ChecksumAddress.fromSimple('cfx:acc7uawf5ubtnmezvhu9dhc6sghea0403y2dgpyfjp').toString())
    .toEqual('CFX:TYPE.CONTRACT:ACC7UAWF5UBTNMEZVHU9DHC6SGHEA0403Y2DGPYFJP');

  expect(() => ChecksumAddress.fromSimple(null))
    .toThrow('expected a string');
  expect(() => ChecksumAddress.fromSimple('cfx:aauaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa054z9ya'))
    .toThrow('not match regex');
  expect(() => ChecksumAddress.fromSimple('cfx:aauaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa054z9ya1'))
    .toThrow('unexpected address prefix');
});

test('to', () => {
  const checksumAddress = ChecksumAddress('CFX:TYPE.NULL:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA0SFBNJM2');

  expect(checksumAddress.isValid()).toEqual(true);
  expect(checksumAddress.toHex()).toEqual('0x0000000000000000000000000000000000000000');
  expect(checksumAddress.toBuffer()).toEqual(format.hexBuffer('0x0000000000000000000000000000000000000000'));
  expect(checksumAddress.toSimple()).toEqual('cfx:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa0sfbnjm2');
  expect(checksumAddress.toObject()).toEqual({
    netName: 'CFX',
    addressType: 'NULL',
    payload: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    checksum: '0SFBNJM2',
  });
});

test('isValid', () => {
  expect(ChecksumAddress('CFX:TYPE.NULL:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA0SFBNJM2').isValid())
    .toEqual(true);

  expect(ChecksumAddress('CFX:TYPE.NULL:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA0SFBNJM3').isValid())
    .toEqual(false);
});
