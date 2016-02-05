import { isNull } from 'lodash';
import { initials } from '../../../schema/fields/initials';

describe('initials', () => {
  it('returns the initials for a string with normal orthography', () => {
    initials('Richard Prince').should.equal('RP');
    initials('Harm van den Dorpel').should.equal('HD');
  });

  it('returns initials for single words', () => {
    initials('Prince').should.equal('P');
    initials('prince').should.equal('P');
  });

  it('returns initials for strings with unconventional orthography', () => {
    initials('e e cummings').should.equal('EEC');
    initials('e e cummings', 2).should.equal('EE');
  });

  it('is a little weird for numbers', () => {
    initials('247365').should.equal('2');
  });

  it('returns null when the value is undefined', () => {
    isNull(initials()).should.be.true();
  });
});
