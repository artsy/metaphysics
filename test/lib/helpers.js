import {
  toKey,
  isExisty,
} from '../../lib/helpers';

describe('toKey', () => {
  it('returns a stringified key given a path', () => {
    toKey('foo/bar')
      .should.equal('foo/bar?');
  });

  it('returns a stringified key given a path and an option', () => {
    toKey('foo/bar', { sort: 'asc' })
      .should.equal('foo/bar?sort=asc');
  });

  it('returns a stringified key given a path and multiple options', () => {
    toKey('foo/bar', {
      sort: 'asc',
      sleep: false,
      size: 10,
    })
      .should.equal('foo/bar?size=10&sleep=false&sort=asc');
  });

  it('sorts the option keys in alphabetical order', () => {
    toKey('foo/bar', {
      a: 3,
      z: 'whatever',
      b: 99,
      d: false,
      c: 0,
    })
      .should.equal('foo/bar?a=3&b=99&c=0&d=false&z=whatever');
  });
});

describe('isExisty', () => {
  describe('existy things', () => {
    it('returns `true` for Integers', () => {
      isExisty(0).should.be.true();
      isExisty(100).should.be.true();
    });

    it('returns `true` for Strings', () => {
      isExisty('0').should.be.true();
      isExisty('Foobar').should.be.true();
    });

    it('returns `true` for `NaN`', () => {
      isExisty(NaN).should.be.true();
    });

    it('returns `true` for non-empty Objects', () => {
      isExisty({ foo: 'bar' }).should.be.true();
    });
  });

  describe('not existy things', () => {
    it('returns `false` for empty Objects', () => {
      isExisty({}).should.be.false();
    });

    it('returns `false` for empty Strings', () => {
      isExisty('').should.be.false();
    });

    it('returns `false` for `undefined`', () => {
      isExisty(undefined).should.be.false();
    });

    it('returns `false` for `null`', () => {
      isExisty(null).should.be.false();
    });
  });
});
