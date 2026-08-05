'use strict';

const { parseJsonBody } = require('../src/json-body');
const { messageOf } = require('../src/api-exception.filter');

describe('messageOf', () => {
  it('unwraps the shapes Nest can put in an HttpException body', () => {
    expect(messageOf('Not Found')).toBe('Not Found');
    expect(messageOf({ message: 'Unauthorized' })).toBe('Unauthorized');
    expect(messageOf({ message: ['first', 'second'] })).toBe('first');
  });

  it.each([undefined, null, {}, { statusCode: 500 }])(
    'falls back to a generic message for %p',
    (payload) => {
      expect(messageOf(payload)).toBe('Error');
    }
  );
});

describe('parseJsonBody', () => {
  it('parses a JSON object body', () => {
    expect(parseJsonBody(Buffer.from('{"username":"user1"}'))).toEqual({
      username: 'user1',
    });
  });

  it.each([
    ['an empty buffer', Buffer.alloc(0)],
    ['a missing body', undefined],
    ['malformed JSON', Buffer.from('{not json')],
    ['a JSON scalar', Buffer.from('"user1"')],
    ['JSON null', Buffer.from('null')],
  ])('falls back to an empty object for %s', (_label, raw) => {
    expect(parseJsonBody(raw)).toEqual({});
  });
});
