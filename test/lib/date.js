import { isNull } from 'lodash';
import moment from 'moment';
import { exhibitionPeriod, exhibitionStatus } from '../../lib/date';

describe('date', () => {
  describe('exhibitionPeriod', () => {
    it('includes the start and end date', () => {
      const period = exhibitionPeriod(moment('2011-01-01'), moment('2014-04-19'));
      expect(period).toBe('Jan 1, 2011 – Apr 19, 2014');
    });

    it('does not include the year of the start date if it’s the same year as the end date', () => {
      const period = exhibitionPeriod(moment('2011-01-01'), moment('2011-04-19'));
      expect(period).toBe('Jan 1 – Apr 19, 2011');
    });

    it('does not include the month of the end date if it’s the same as the start date', () => {
      const period = exhibitionPeriod(moment('2011-01-01'), moment('2011-01-19'));
      expect(period).toBe('Jan 1 – 19, 2011');
    });

    it('does not include the year of the end date if it’s in the current year', () => {
      const period = exhibitionPeriod(moment('2011-01-01'), moment().format('YYYY-04-19'));
      expect(period).toBe('Jan 1, 2011 – Apr 19');
    });

    it('does not include a year at all if both start and end date are in the current year', () => {
      const period = exhibitionPeriod(moment().format('YYYY-01-01'), moment().format('YYYY-01-19'));
      expect(period).toBe('Jan 1 – 19');
    });
  });

  describe('exhibitionStatus', () => {
    let today = null;

    beforeEach(() => {
      today = moment();
    });

    describe('before an exhibition opens', () => {
      let future = null;

      beforeEach(() => {
        future = today.clone().add(1, 'M');
      });

      it('states that an exhibition opens today', () => {
        const status = exhibitionStatus(today, future);
        expect(status).toBe('Opening today');
      });

      it('states that an exhibition opens tomorrow', () => {
        const status = exhibitionStatus(today.add(1, 'd'), future);
        expect(status).toBe('Opening tomorrow');
      });

      it('states that an exhibition opens in a few days', () => {
        for (let days = 2; days <= 5; days++) {
          const status = exhibitionStatus(today.clone().add(days, 'd'), future);
          expect(status).toBe(`Opening in ${days} days`);
        }
      });

      it('returns nothing when it opens in more than a few days', () => {
        const status = exhibitionStatus(today.add(6, 'd'), future);
        expect(isNull(status)).toBe(true);
      });
    });

    describe('before an exhibition opens', () => {
      let past = null;

      beforeEach(() => {
        past = today.clone().subtract(1, 'M');
      });

      it('states that an exhibition will close today', () => {
        const status = exhibitionStatus(past, today);
        expect(status).toBe('Closing today');
      });

      it('states that an exhibition will close tomorrow', () => {
        const status = exhibitionStatus(past, today.add(1, 'd'));
        expect(status).toBe('Closing tomorrow');
      });

      it('states that an exhibition is about to close in a few days', () => {
        for (let days = 2; days <= 5; days++) {
          const status = exhibitionStatus(past, today.clone().add(days, 'd'));
          expect(status).toBe(`Closing in ${days} days`);
        }
      });

      it('returns nothing when it closes in more than a few days', () => {
        const status = exhibitionStatus(past, today.add(6, 'd'));
        expect(isNull(status)).toBe(true);
      });
    });
  });
});
