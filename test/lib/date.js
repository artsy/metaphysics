import moment from 'moment';
import { exhibitionPeriod } from '../../lib/date';

describe('date', () => {
  describe('exhibitionPeriod', () => {
    it('includes the start and end date', () => {
      const period = exhibitionPeriod(moment('2011-01-01'), moment('2014-04-19'));
      period.should.equal('Jan 1, 2011 – Apr 19, 2014');
    });

    it('does not include the year of the start date if it’s the same year as the end date', () => {
      const period = exhibitionPeriod(moment('2011-01-01'), moment('2011-04-19'));
      period.should.equal('Jan 1 – Apr 19, 2011');
    });

    it('does not include the month of the end date if it’s the same as the start date', () => {
      const period = exhibitionPeriod(moment('2011-01-01'), moment('2011-01-19'));
      period.should.equal('Jan 1 – 19, 2011');
    });

    it('does not include the year of the end date if it’s in the current year', () => {
      const period = exhibitionPeriod(moment('2011-01-01'), moment().format('YYYY-04-19'));
      period.should.equal('Jan 1, 2011 – Apr 19');
    });

    it('does not include a year at all if both start and end date are in the current year', () => {
      const period = exhibitionPeriod(moment().format('YYYY-01-01'), moment().format('YYYY-01-19'));
      period.should.equal('Jan 1 – 19');
    });
  });
});
