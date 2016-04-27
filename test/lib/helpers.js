import {
  exclude,
  toKey,
  isExisty,
} from '../../lib/helpers';

describe('exclude', () => {
  const xs = [
    { id: 'foo', name: 'Foo' },
    { id: 'bar', name: 'Bar' },
    { id: 'baz', name: 'Baz' },
  ];

  it('excludes objects given a list of values and which property to match against', () => {
    exclude(['foo', 'baz'], 'id')(xs)
      .should.eql([
        { id: 'bar', name: 'Bar' },
      ]);
  });

  it('simply returns the list if invoked without arguments', () => {
    exclude()(xs)
      .should.eql(xs);
  });
});

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
      isExisty(' Foo bar ').should.be.true();
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

    it('returns `false` for whitespace Strings', () => {
      isExisty(' ').should.be.false();
      isExisty(' \n ').should.be.false();
      isExisty(' \n\n').should.be.false();
    });

    it('returns `false` for `undefined`', () => {
      isExisty(undefined).should.be.false();
    });

    it('returns `false` for `null`', () => {
      isExisty(null).should.be.false();
    });
  });
});
