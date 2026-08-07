'use strict';

const { parseJsonBody } = require('../src/json-body');
const { messageOf, isApiPath } = require('../src/api-exception.filter');

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

describe('isApiPath', () => {
  it.each(['/api', '/api/', '/api/nope', '/api/auth/me'])(
    'guards %p',
    (path) => {
      expect(isApiPath(path)).toBe(true);
    }
  );

  it.each(['/', '/nope', '/apifoo', 'api/nope', undefined, null])(
    'leaves %p alone',
    (path) => {
      expect(isApiPath(path)).toBe(false);
    }
  );
});

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
