import { isNull } from "lodash"
import moment, { Moment } from "moment"
import {
  dateRange,
  exhibitionStatus,
  datesWithHours,
  datesWithDaysAndHours,
  singleDateWithoutHour,
  singleDate,
  singleHour,
  formattedOpeningHours,
  datesAreSameDay,
  formattedHours,
} from "lib/date"

describe("date formatting", () => {
  describe("formattedHours", () => {
    it("If within same am/pm", () => {
      const period = formattedHours(
        "2022-12-30T08:00:00+00:00",
        "2022-12-30T10:00:00+00:00"
      )
      expect(period).toBe("8:00 – 10:00am")
    })

    it("If within across both am/pm", () => {
      const period = formattedHours(
        "2021-12-05T08:00:00+00:00",
        "2022-12-30T17:00:00+00:00"
      )
      expect(period).toBe("8:00am – 5:00pm")
    })
  })

  describe("datesAreSameDay", () => {
    it("Dates are the same day", () => {
      const period = datesAreSameDay(
        "2022-12-30T20:00:00+00:00",
        "2022-12-30T17:00:00+00:00"
      )
      expect(period).toBe(true)
    })

    it("Dates are not the same day", () => {
      const period = datesAreSameDay(
        "2021-12-05T20:00:00+00:00",
        "2022-12-30T17:00:00+00:00"
      )
      expect(period).toBe(false)
    })
  })

  describe("formattedOpeningHours", () => {
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
      expect(period).toBe("Opens Dec 5 at 8pm")
    })

    it("Event is running and closes in the future", () => {
      const period = formattedOpeningHours(
        "2017-12-05T20:00:00+00:00",
        "2019-12-30T17:00:00+00:00"
      )
      expect(period).toBe("Closes Dec 30 at 5pm")
    })

    it("Event ended in the past and is closed", () => {
      const period = formattedOpeningHours(
        "2016-12-05T20:00:00+00:00",
        "2016-12-30T17:00:00+00:00"
      )
      expect(period).toBe("Closed")
    })
  })

  describe("singleHour", () => {
    it("includes single date in this year", () => {
      const period = singleHour("2018-12-05T20:00:00+00:00")
      expect(period).toBe("8:00pm")
    })
  })

  describe("singleDate", () => {
    const realNow = Date.now
    beforeEach(() => {
      Date.now = () => new Date("2018-01-30T03:24:00") as any
    })
    afterEach(() => {
      Date.now = realNow
    })

    it("includes single date in this year", () => {
      const period = singleDate("2018-12-05T20:00:00+00:00")
      expect(period).toBe("Dec 5 at 8:00pm")
    })

    it("includes single date in different year from now", () => {
      const period = singleDate("2021-12-05T20:00:00+00:00")
      expect(period).toBe("Dec 5, 2021 at 8:00pm")
    })
  })

  describe("singleDateWithoutHour", () => {
    const realNow = Date.now
    beforeEach(() => {
      Date.now = () => new Date("2018-01-30T03:24:00") as any
    })
    afterEach(() => {
      Date.now = realNow
    })

    it("includes single date in this year", () => {
      const period = singleDateWithoutHour("2018-12-05T20:00:00+00:00")
      expect(period).toBe("Wed, Dec 5")
    })

    it("includes single date in different year from now", () => {
      const period = singleDateWithoutHour("2021-12-05T20:00:00+00:00")
      expect(period).toBe("Sun, Dec 5, 2021")
    })
  })

  describe("datesWithHours", () => {
    const realNow = Date.now
    beforeEach(() => {
      Date.now = () => new Date("2018-01-30T03:24:00") as any
    })
    afterEach(() => {
      Date.now = realNow
    })

    it("includes the start and end date with different years", () => {
      const period = datesWithHours(
        "2021-12-05T20:00:00+00:00",
        "2022-12-30T17:00:00+00:00"
      )
      expect(period).toBe("Dec 5, 2021 at 8:00pm – Dec 30, 2022 at 5:00pm")
    })

    it("includes the start and end date with different year from now", () => {
      const period = datesWithHours(
        "2020-12-05T20:00:00+00:00",
        "2020-12-30T17:00:00+00:00"
      )
      expect(period).toBe("Dec 5, 2020 at 8:00pm – Dec 30, 2020 at 5:00pm")
    })

    it("includes the start and end date in current year", () => {
      const period = datesWithHours(
        "2018-12-05T20:00:00+00:00",
        "2018-12-30T17:00:00+00:00"
      )
      expect(period).toBe("Dec 5 at 8:00pm – Dec 30 at 5:00pm")
    })

    it("date is same day in different year from now", () => {
      const period = datesWithHours(
        "2019-12-05T20:00:00+00:00",
        "2019-12-05T22:00:00+00:00"
      )
      expect(period).toBe("Dec 5, 2019 from 8:00 – 10:00pm")
    })

    it("date is same day in same year as now", () => {
      const period = datesWithHours(
        "2018-12-05T20:00:00+00:00",
        "2018-12-05T22:00:00+00:00"
      )
      expect(period).toBe("Dec 5 from 8:00 – 10:00pm")
    })
  })

  describe("datesWithDaysAndHours", () => {
    const realNow = Date.now
    beforeEach(() => {
      Date.now = () => new Date("2018-01-30T03:24:00") as any
    })
    afterEach(() => {
      Date.now = realNow
    })

    it("includes the start and end date with different years", () => {
      const period = datesWithDaysAndHours(
        "2021-12-05T20:00:00+00:00",
        "2022-12-30T17:00:00+00:00"
      )
      expect(period).toBe(
        "Sun, Dec 5, 2021 at 8:00pm – Fri, Dec 30, 2022 at 5:00pm"
      )
    })

    it("includes the start and end date with different year from now", () => {
      const period = datesWithDaysAndHours(
        "2020-12-05T20:00:00+00:00",
        "2020-12-30T17:00:00+00:00"
      )
      expect(period).toBe(
        "Sat, Dec 5, 2020 at 8:00pm – Wed, Dec 30, 2020 at 5:00pm"
      )
    })

    it("includes the start and end date in current year", () => {
      const period = datesWithDaysAndHours(
        "2018-12-05T20:00:00+00:00",
        "2018-12-30T17:00:00+00:00"
      )
      expect(period).toBe("Wed, Dec 5 at 8:00pm – Sun, Dec 30 at 5:00pm")
    })

    it("date is same day in different year from now", () => {
      const period = datesWithDaysAndHours(
        "2019-12-05T20:00:00+00:00",
        "2019-12-05T22:00:00+00:00"
      )
      expect(period).toBe("Thu, Dec 5, 2019 from 8:00 – 10:00pm")
    })

    it("date is same day in same year as now", () => {
      const period = datesWithDaysAndHours(
        "2018-12-05T20:00:00+00:00",
        "2018-12-05T22:00:00+00:00"
      )
      expect(period).toBe("Wed, Dec 5 from 8:00 – 10:00pm")
    })
  })

  describe("dateRange", () => {
    it("includes the start and end date", () => {
      const period = exhibitionPeriod(
        moment("2011-01-01T00:00-0400"),
        moment("2014-04-19T00:00-0400")
      )
      expect(period).toBe("Jan 1, 2011 – Apr 19, 2014")
    })

    it("different years and same month", () => {
      const period = exhibitionPeriod(
        moment("2011-01-01T00:00-0400"),
        moment("2014-01-04T00:00-0400")
      )
      expect(period).toBe("Jan 1, 2011 – Jan 4, 2014")
    })

    it("does not include the year of the start date if it’s the same year as the end date", () => {
      const period = exhibitionPeriod(
        moment("2011-01-01T00:00-0400"),
        moment("2011-04-19T00:00-0400")
      )
      expect(period).toBe("Jan 1 – Apr 19, 2011")
    })

    it("does not include the month of the end date if it’s the same as the start date", () => {
      const period = exhibitionPeriod(
        moment("2011-01-01T00:00-0400"),
        moment("2011-01-19T00:00-0400")
      )
      expect(period).toBe("Jan 1 – 19, 2011")
    })

    it("If one date's year is different show both years", () => {
      const period = exhibitionPeriod(
        moment("2011-01-01T00:00-0400"),
        moment().format("YYYY-04-19")
      )
      expect(period).toBe("Jan 1, 2011 – Apr 19, 2019")
    })

    it("does not include a year at all if both start and end date are in the current year", () => {
      const period = dateRange(
        moment().format("YYYY-01-01"),
        moment().format("YYYY-01-19")
      )
      expect(period).toBe("Jan 1 – 19")
    })
  })

  describe("exhibitionStatus", () => {
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

    describe("before an exhibition opens", () => {
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
