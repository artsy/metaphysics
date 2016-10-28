import {
  exclude,
  toKey,
  isExisty,
  stripTags,
} from '../../lib/helpers';

describe('exclude', () => {
  const xs = [
    { id: 'foo', name: 'Foo' },
    { id: 'bar', name: 'Bar' },
    { id: 'baz', name: 'Baz' },
  ];

  it('excludes objects given a list of values and which property to match against', () => {
    expect(exclude(['foo', 'baz'], 'id')(xs))
      .to.eql([
        { id: 'bar', name: 'Bar' },
      ]);
  });

  it('simply returns the list if invoked without arguments', () => {
    expect(exclude()(xs))
      .to.eql(xs);
  });
});

describe('toKey', () => {
  it('returns a stringified key given a path', () => {
    expect(toKey('foo/bar'))
      .to.equal('foo/bar?');
  });

  it('returns a stringified key given a path and an option', () => {
    expect(toKey('foo/bar', { sort: 'asc' }))
      .to.equal('foo/bar?sort=asc');
  });

  it('returns a stringified key given a path and multiple options', () => {
    expect(toKey('foo/bar', {
      sort: 'asc',
      sleep: false,
      size: 10,
    }))
      .to.equal('foo/bar?size=10&sleep=false&sort=asc');
  });

  it('sorts the option keys in alphabetical order', () => {
    expect(toKey('foo/bar', {
      a: 3,
      z: 'whatever',
      b: 99,
      d: false,
      c: 0,
    }))
      .to.equal('foo/bar?a=3&b=99&c=0&d=false&z=whatever');
  });
});

describe('isExisty', () => {
  describe('existy things', () => {
    it('returns `true` for Integers', () => {
      expect(isExisty(0)).to.be(true);
      expect(isExisty(100)).to.be(true);
    });

    it('returns `true` for Strings', () => {
      expect(isExisty('0')).to.be(true);
      expect(isExisty('Foobar')).to.be(true);
      expect(isExisty(' Foo bar ')).to.be(true);
    });

    it('returns `true` for `NaN`', () => {
      expect(isExisty(NaN)).to.be(true);
    });

    it('returns `true` for non-empty Objects', () => {
      expect(isExisty({ foo: 'bar' })).to.be(true);
    });
  });

  describe('not existy things', () => {
    it('returns `false` for empty Objects', () => {
      expect(isExisty({})).to.be(false);
    });

    it('returns `false` for empty Strings', () => {
      expect(isExisty('')).to.be(false);
    });

    it('returns `false` for whitespace Strings', () => {
      expect(isExisty(' ')).to.be(false);
      expect(isExisty(' \n ')).to.be(false);
      expect(isExisty(' \n\n')).to.be(false);
    });

    it('returns `false` for `undefined`', () => {
      expect(isExisty(undefined)).to.be(false);
    });

    it('returns `false` for `null`', () => {
      expect(isExisty(null)).to.be(false);
    });
  });
});

describe('stripTags', () => {
  const html = '<a href="http://google.com">Cabbie</a>';

  it('strips html from a string', () => {
    expect(stripTags(html)).to.eql('Cabbie');
  });

  it('returns an empty string if no string is provided', () => {
    expect(stripTags()).to.eql('');
  });
});
