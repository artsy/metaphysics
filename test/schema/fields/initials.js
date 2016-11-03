import { isNull } from 'lodash';
import { generateInitials } from '../../../schema/fields/initials';

describe('initials', () => {
  it('returns the initials for a string with normal orthography', () => {
    generateInitials('Richard Prince').should.equal('RP');
    generateInitials('Harm van den Dorpel').should.equal('HD');
  });

  it('returns initials for single words', () => {
    generateInitials('Prince').should.equal('P');
    generateInitials('prince').should.equal('P');
  });

  it('returns initials for strings with unconventional orthography', () => {
    generateInitials('e e cummings').should.equal('EEC');
    generateInitials('e e cummings', 2).should.equal('EE');
  });

  it('is a little weird for numbers', () => {
    generateInitials('247365').should.equal('2');
  });

  it('returns null when the value is undefined', () => {
    isNull(generateInitials()).should.be.true();
  });
});
