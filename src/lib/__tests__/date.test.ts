import { isNull } from "lodash"
import moment, { Moment } from "moment-timezone"
import {
  dateRange,
  exhibitionStatus,
  dateTimeRange,
  singleDate,
  singleDateTime,
  singleTime,
  formattedOpeningHours,
  datesAreSameDay,
  timeRange,
} from "lib/date"

describe("date formatting", () => {
  describe(timeRange, () => {
    it("If within same am/pm only display one am or pm", () => {
      const period = timeRange(
        "2022-12-30T08:00:00+00:00",
        "2022-12-30T10:00:00+00:00"
      )
      expect(period).toBe("8:00 – 10:00am UTC")
    })

    it("If not within same am/pm show both time periods", () => {
      const period = timeRange(
        "2021-12-05T08:00:00+00:00",
        "2022-12-30T17:00:00+00:00"
      )
      expect(period).toBe("8:00am – 5:00pm UTC")
    })

    it("Displays timeRange with unique timezone", () => {
      const period = timeRange(
        "2021-12-05T08:00:00+00:00",
        "2022-12-30T17:00:00+00:00",
        "America/New_York"
      )
      expect(period).toBe("3:00 – 12:00pm EST")
    })
  })

  describe(datesAreSameDay, () => {
    it("Dates are the same day returns true", () => {
      const period = datesAreSameDay(
        "2022-12-30T20:00:00+00:00",
        "2022-12-30T17:00:00+00:00"
      )
      expect(period).toBe(true)
    })

    it("Dates are not the same day returns false", () => {
      const period = datesAreSameDay(
        "2021-12-05T20:00:00+00:00",
        "2022-12-30T17:00:00+00:00"
      )
      expect(period).toBe(false)
    })

    it("Dates are not the same day with timezone", () => {
      const period = datesAreSameDay(
        "2021-12-05T20:00:00+00:00",
        "2022-12-30T17:00:00+00:00",
        "America/New_York"
      )
      expect(period).toBe(false)
    })

    it("Dates are not the same day with timezone", () => {
      const period = datesAreSameDay(
        "2021-12-05T20:00:00+00:00",
        "2022-12-30T17:00:00+00:00",
        "America/New_York"
      )
      expect(period).toBe(false)
    })
  })

  describe(formattedOpeningHours, () => {
    const realNow = Date.now
    beforeEach(() => {
      Date.now = () => new Date("2018-01-30T03:24:00") as any
    })
    afterEach(() => {
      Date.now = realNow
    })

    it("Event opens in the future", () => {
      const period = formattedOpeningHours(
        "2021-12-05T20:00:00+00:00",
        "2022-12-30T17:00:00+00:00"
      )
      expect(period).toBe("Opens Dec 5 at 8:00pm UTC")
    })

    it("Event is running and closes in the future", () => {
      const period = formattedOpeningHours(
        "2017-12-05T20:00:00+00:00",
        "2019-12-30T17:00:00+00:00"
      )
      expect(period).toBe("Closes Dec 30 at 5:00pm UTC")
    })

    it("Event ended in the past and is closed", () => {
      const period = formattedOpeningHours(
        "2016-12-05T20:00:00+00:00",
        "2016-12-30T17:00:00+00:00"
      )
      expect(period).toBe("Closed")
    })
  })

  describe(singleTime, () => {
    it("Return singleTime moment by the hour using default UTC timezone", () => {
      const period = singleTime("2018-12-05T20:00:00+00:00")
      expect(period).toBe("8:00pm UTC")
    })

    it("Return singleTime in EST timezone", () => {
      const period = singleTime("2018-12-05T20:00:00+00:00", "America/New_York")
      expect(period).toBe("3:00pm EST")
    })
  })

  describe(singleDateTime, () => {
    const realNow = Date.now
    beforeEach(() => {
      Date.now = () => new Date("2018-01-30T03:24:00") as any
    })
    afterEach(() => {
      Date.now = realNow
    })

    it("Returns single date and time in this year", () => {
      const period = singleDateTime("2018-12-05T20:00:00+00:00")
      expect(period).toBe("Dec 5 at 8:00pm UTC")
    })

    it("Returns single date in different year from now", () => {
      const period = singleDateTime("2021-12-05T20:00:00+00:00")
      expect(period).toBe("Dec 5, 2021 at 8:00pm UTC")
    })

    it("Returns single date with timezone", () => {
      const period = singleDateTime(
        "2021-12-05T20:00:00+00:00",
        "America/Costa_Rica"
      )
      expect(period).toBe("Dec 5, 2021 at 2:00pm CST")
    })
  })

  describe(singleDate, () => {
    const realNow = Date.now
    beforeEach(() => {
      Date.now = () => new Date("2018-01-30T03:24:00") as any
    })
    afterEach(() => {
      Date.now = realNow
    })

    it("Returns single date in this year with day of week", () => {
      const period = singleDate("2018-12-05T20:00:00+00:00")
      expect(period).toBe("Wed, Dec 5")
    })

    it("Returns single date with day of week in different year from now", () => {
      const period = singleDate("2021-12-05T20:00:00+00:00")
      expect(period).toBe("Sun, Dec 5, 2021")
    })
  })

  describe(dateTimeRange, () => {
    const realNow = Date.now
    beforeEach(() => {
      Date.now = () => new Date("2018-01-30T03:24:00") as any
    })
    afterEach(() => {
      Date.now = realNow
    })

    it("Returns start and end datetimes with different years", () => {
      const period = dateTimeRange(
        "2021-12-05T20:00:00+00:00",
        "2022-12-30T17:00:00+00:00"
      )
      expect(period).toBe("Dec 5, 2021 at 8:00pm – Dec 30, 2022 at 5:00pm UTC")
    })

    it("Returns the start and end date with different year from now", () => {
      const period = dateTimeRange(
        "2040-12-05T20:00:00+00:00",
        "2040-12-30T17:00:00+00:00"
      )
      expect(period).toBe("Dec 5, 2040 at 8:00pm – Dec 30, 2040 at 5:00pm UTC")
    })

    it("Returns the start and end datetimes in current year", () => {
      const period = dateTimeRange(
        "2018-12-05T20:00:00+00:00",
        "2018-12-30T17:00:00+00:00"
      )
      expect(period).toBe("Dec 5 at 8:00pm – Dec 30 at 5:00pm UTC")
    })

    it("Returns single datetime in different year from now", () => {
      const period = dateTimeRange(
        "2019-12-05T20:00:00+00:00",
        "2019-12-05T22:00:00+00:00"
      )
      expect(period).toBe("Dec 5, 2019 from 8:00 – 10:00pm UTC")
    })

    it("Displays just date and time if dates are the same day and same year", () => {
      const period = dateTimeRange(
        "2018-12-05T20:00:00+00:00",
        "2018-12-05T22:00:00+00:00"
      )
      expect(period).toBe("Dec 5 from 8:00 – 10:00pm UTC")
    })

    it("Returns the start and end datetime range with separate years which displays both years", () => {
      const period = dateTimeRange(
        "2021-12-05T20:00:00+00:00",
        "2022-12-30T17:00:00+00:00",
        true
      )
      expect(period).toBe(
        "Sun, Dec 5, 2021 at 8:00pm – Fri, Dec 30, 2022 at 5:00pm UTC"
      )
    })

    it("Returns date range with the start and end dates falling in a different year from now", () => {
      const period = dateTimeRange(
        "2020-12-05T20:00:00+00:00",
        "2020-12-30T17:00:00+00:00",
        true
      )
      expect(period).toBe(
        "Sat, Dec 5, 2020 at 8:00pm – Wed, Dec 30, 2020 at 5:00pm UTC"
      )
    })

    it("Returns date range in same year as now", () => {
      const period = dateTimeRange(
        "2018-12-05T20:00:00+00:00",
        "2018-12-30T17:00:00+00:00",
        true
      )
      expect(period).toBe("Wed, Dec 5 at 8:00pm – Sun, Dec 30 at 5:00pm UTC")
    })

    it("Returns single date in different year from now", () => {
      const period = dateTimeRange(
        "2019-12-05T20:00:00+00:00",
        "2019-12-05T22:00:00+00:00",
        true
      )
      expect(period).toBe("Thu, Dec 5, 2019 from 8:00 – 10:00pm UTC")
    })

    it("Returns same day in same year as now", () => {
      const period = dateTimeRange(
        "2018-12-05T20:00:00+00:00",
        "2018-12-05T22:00:00+00:00",
        true
      )
      expect(period).toBe("Wed, Dec 5 from 8:00 – 10:00pm UTC")
    })

    it("Returns dateTimeRange with timezone", () => {
      const period = dateTimeRange(
        "2018-12-05T20:00:00+00:00",
        "2018-12-05T22:00:00+00:00",
        true,
        "America/Costa_Rica"
      )
      expect(period).toBe("Wed, Dec 5 from 2:00 – 4:00pm CST")
    })
  })

  describe(dateRange, () => {
    it("Returns date range with two different dates in two different years", () => {
      const period = dateRange(moment("2011-01-01"), moment("2014-04-19"))
      expect(period).toBe("Jan 1, 2011 – Apr 19, 2014")
    })

    it("Returns date range with different years and same month", () => {
      const period = dateRange(moment("2011-01-01"), moment("2014-01-04"))
      expect(period).toBe("Jan 1, 2011 – Jan 4, 2014")
    })

    it("Returns date range with that has same year for both dates, which displays only one year", () => {
      const period = dateRange(moment("2011-01-01"), moment("2011-04-19"))
      expect(period).toBe("Jan 1 – Apr 19, 2011")
    })

    it("Displays one month if the start and end dates have the same month", () => {
      const period = dateRange(moment("2011-01-01"), moment("2011-01-19"))
      expect(period).toBe("Jan 1 – 19, 2011")
    })

    it("If years are different always show both years", () => {
      const period = dateRange(
        moment("2011-01-01"),
        moment().format("YYYY-04-19")
      )
      expect(period).toBe("Jan 1, 2011 – Apr 19, 2019")
    })

    it("If both dates are within the present year don't display a year", () => {
      const period = dateRange(
        moment().format("YYYY-01-01"),
        moment().format("YYYY-01-19")
      )
      expect(period).toBe("Jan 1 – 19")
    })
  })

  describe(exhibitionStatus, () => {
    let today: Moment = null as any

    beforeEach(() => {
      today = moment()
    })

    describe("before an exhibition opens", () => {
      let future: Moment = null as any

      beforeEach(() => {
        future = today.clone().add(1, "M")
      })

      it("states that an exhibition opens today", () => {
        const status = exhibitionStatus(today, future)
        expect(status).toBe("Opening today")
      })

      it("states that an exhibition opens tomorrow", () => {
        const status = exhibitionStatus(today.add(1, "d"), future)
        expect(status).toBe("Opening tomorrow")
      })

      it("states that an exhibition opens in a few days", () => {
        for (let days = 2; days <= 5; days++) {
          const status = exhibitionStatus(today.clone().add(days, "d"), future)
          expect(status).toBe(`Opening in ${days} days`)
        }
      })

      it("returns nothing when it opens in more than a few days", () => {
        const status = exhibitionStatus(today.add(6, "d"), future)
        expect(isNull(status)).toBe(true)
      })
    })

    describe("before an exhibition closes", () => {
      let past: Moment = null as any

      beforeEach(() => {
        past = today.clone().subtract(1, "M")
      })

      it("states that an exhibition will close today", () => {
        const status = exhibitionStatus(past, today)
        expect(status).toBe("Closing today")
      })

      it("states that an exhibition will close tomorrow", () => {
        const status = exhibitionStatus(past, today.add(1, "d"))
        expect(status).toBe("Closing tomorrow")
      })

      it("states that an exhibition is about to close in a few days", () => {
        for (let days = 2; days <= 5; days++) {
          const status = exhibitionStatus(past, today.clone().add(days, "d"))
          expect(status).toBe(`Closing in ${days} days`)
        }
      })

      it("returns nothing when it closes in more than a few days", () => {
        const status = exhibitionStatus(past, today.add(6, "d"))
        expect(isNull(status)).toBe(true)
      })
    })
  })
})
