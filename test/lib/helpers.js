import { isExisty } from '../../lib/helpers';

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

    it('returns `false` for `undefined`', () => {
      isExisty(undefined).should.be.false();
    });

    it('returns `false` for `null`', () => {
      isExisty(null).should.be.false();
    });
  });
});
