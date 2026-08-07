'use strict';

const { parseJsonBody } = require('../src/json-body');

describe('parseJsonBody', () => {
  it('parses a JSON object body', () => {
    expect(parseJsonBody(Buffer.from('{"username":"user1"}'))).toEqual({
      username: 'user1',
    });
  });

  it('keeps an empty JSON object, which validation still rejects field by field', () => {
    expect(parseJsonBody(Buffer.from('{}'))).toEqual({});
  });

  it.each([
    ['an empty buffer', Buffer.alloc(0)],
    ['a missing body', undefined],
    ['malformed JSON', Buffer.from('{not json')],
    ['a JSON scalar', Buffer.from('"user1"')],
    ['JSON null', Buffer.from('null')],
    ['a JSON array', Buffer.from('["a","b"]')],
  ])('returns null for %s', (_label, raw) => {
    expect(parseJsonBody(raw)).toBeNull();
  });
});
