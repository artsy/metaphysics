import { isNull } from 'lodash';
import { initials } from '../../../schema/fields/initials';

describe('initials', () => {
  it('returns the initials for a string with normal orthography', () => {
    expect(initials('Richard Prince')).to.equal('RP');
    expect(initials('Harm van den Dorpel')).to.equal('HD');
  });

  it('returns initials for single words', () => {
    expect(initials('Prince')).to.equal('P');
    expect(initials('prince')).to.equal('P');
  });

  it('returns initials for strings with unconventional orthography', () => {
    expect(initials('e e cummings')).to.equal('EEC');
    expect(initials('e e cummings', 2)).to.equal('EE');
  });

  it('is a little weird for numbers', () => {
    expect(initials('247365')).to.equal('2');
  });

  it('returns null when the value is undefined', () => {
    expect(isNull(initials())).to.be(true);
  });
});
