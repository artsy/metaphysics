import { isNull } from "lodash"
import moment, { Moment } from "moment-timezone"
import {
  dateRange,
  exhibitionStatus,
  dateTimeRange,
  singleDate,
  singleDateWithDay,
  singleDateTime,
  singleTime,
  formattedOpeningHours,
  formattedStartDateTime,
  datesAreSameDay,
  timeRange,
} from "lib/date"

describe("date formatting", () => {
  describe(timeRange, () => {
    it("includes only one am or pm if within same am/pm", () => {
      const period = timeRange(
        "2022-12-30T08:00:00+00:00",
        "2022-12-30T10:00:00+00:00",
        "UTC"
      )
      expect(period).toBe("8:00 – 10:00am UTC")
    })

    it("includes both am and pm if not within the same am/pm", () => {
      const period = timeRange(
        "2021-12-05T08:00:00+00:00",
        "2022-12-30T17:00:00+00:00",
        "UTC"
      )
      expect(period).toBe("8:00am – 5:00pm UTC")
    })

    it("includes updated time with a specific timezone", () => {
      const period = timeRange(
        "2021-12-05T08:00:00+00:00",
        "2022-12-30T17:00:00+00:00",
        "America/New_York"
      )
      expect(period).toBe("3:00 – 12:00pm EST")
    })
  })

  describe(datesAreSameDay, () => {
    it("returns true if dates are the same day", () => {
      const period = datesAreSameDay(
        "2022-12-30T20:00:00+00:00",
        "2022-12-30T17:00:00+00:00",
        "UTC"
      )
      expect(period).toBe(true)
    })

    it("returns false if dates are not the same day", () => {
      const period = datesAreSameDay(
        "2021-12-05T20:00:00+00:00",
        "2022-12-30T17:00:00+00:00",
        "UTC"
      )
      expect(period).toBe(false)
    })

    it("returns true if dates are the same day with specific timezone", () => {
      const period = datesAreSameDay(
        "2021-12-05T20:00:00+00:00",
        "2022-12-30T17:00:00+00:00",
        "America/New_York"
      )
      expect(period).toBe(false)
    })

    it("returns false if dates are not the same day with specific timezone", () => {
      const period = datesAreSameDay(
        "2021-12-05T20:00:00+00:00",
        "2022-12-30T17:00:00+00:00",
        "America/New_York"
      )
      expect(period).toBe(false)
    })
  })

  describe(formattedStartDateTime, () => {
    const realNow = Date.now
    beforeEach(() => {
      Date.now = () => new Date("2018-01-30T03:24:00") as any
    })
    afterEach(() => {
      Date.now = realNow
    })

    it("includes 'Starts' when event starts in the future", () => {
      const period = formattedStartDateTime(
        "2045-12-05T20:00:00+00:00",
        "2050-12-30T17:00:00+00:00",
        null,
        "UTC"
      )
      expect(period).toBe("Starts Dec 5, 2045 at 8:00pm UTC")
    })

    it("includes 'Ends' when event is running and terminates in the future", () => {
      const period = formattedStartDateTime(
        "2017-12-05T20:00:00+00:00",
        "2045-12-30T17:00:00+00:00",
        null,
        "UTC"
      )
      expect(period).toBe("Ends Dec 30, 2045 at 5:00pm UTC")
    })

    it("includes 'Ended on date' when event ended in the past and is now closed", () => {
      const period = formattedStartDateTime(
        "2016-12-05T20:00:00+00:00",
        "2016-12-30T17:00:00+00:00",
        null,
        "UTC"
      )
      expect(period).toBe("Ended Dec 30, 2016")
    })

    it("includes 'Starts' when event starts in the future", () => {
      const period = formattedStartDateTime(
        "2045-12-05T20:00:00+00:00",
        "2050-12-30T17:00:00+00:00",
        null,
        "UTC"
      )
      expect(period).toBe("Starts Dec 5, 2045 at 8:00pm UTC")
    })

    it("includes 'Live' string when auction has started but live sale has not", () => {
      const startAt = "2012-12-05T20:00:00+00:00"
      const liveStartAt = "2045-12-05T20:00:00+00:00"
      const endAt = "2045-12-05T20:00:00+00:00"
      const date = formattedStartDateTime(startAt, endAt, liveStartAt, "UTC")
      expect(date).toEqual("Live Dec 5, 2045 at 8:00pm UTC")
    })

    it("includes 'In progress' string when auction is live", () => {
      const startAt = "2012-12-05T20:00:00+00:00"
      const liveStartAt = "2012-12-05T20:00:00+00:00"
      const endAt = "2045-12-05T20:00:00+00:00"
      const date = formattedStartDateTime(startAt, endAt, liveStartAt, "UTC")
      expect(date).toEqual("In progress")
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

    it("includes 'Opens' when event opens in the future", () => {
      const period = formattedOpeningHours(
        "2045-12-05T20:00:00+00:00",
        "2046-12-30T17:00:00+00:00",
        "UTC"
      )
      expect(period).toBe("Opens Dec 5, 2045 at 8:00pm UTC")
    })

    it("includes 'Closes' when event is running and closes in the future", () => {
      const period = formattedOpeningHours(
        "2017-12-05T20:00:00+00:00",
        "2045-12-30T17:00:00+00:00",
        "UTC"
      )
      expect(period).toBe("Closes Dec 30, 2045 at 5:00pm UTC")
    })

    it("includes 'Closed' when event ended in the past and is closed", () => {
      const period = formattedOpeningHours(
        "2016-12-05T20:00:00+00:00",
        "2016-12-30T17:00:00+00:00",
        "UTC"
      )
      expect(period).toBe("Closed")
    })
  })

  describe(singleTime, () => {
    it("includes hour using default UTC timezone", () => {
      const period = singleTime("2018-12-05T20:00:00+00:00", "UTC")
      expect(period).toBe("8:00pm UTC")
    })

    it("also includes hour using specific timezone", () => {
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

    it("includes only the month day and time for dates in the current year", () => {
      const period = singleDateTime("2018-12-05T20:00:00+00:00", "UTC")
      expect(period).toBe("Dec 5 at 8:00pm UTC")
    })

    it("also includes the year for dates in a different year from now", () => {
      const period = singleDateTime("2021-12-05T20:00:00+00:00", "UTC")
      expect(period).toBe("Dec 5, 2021 at 8:00pm UTC")
    })

    it("returns the dates with a specific timezone", () => {
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

    it("includes single date with month day when in current year", () => {
      const period = singleDate("2018-12-05T20:00:00+00:00", "UTC")
      expect(period).toBe("Dec 5")
    })

    it("also includes the year when not in current year", () => {
      const period = singleDate("2021-12-05T20:00:00+00:00", "UTC")
      expect(period).toBe("Dec 5, 2021")
    })
  })

  describe(singleDateWithDay, () => {
    const realNow = Date.now
    beforeEach(() => {
      Date.now = () => new Date("2018-01-30T03:24:00") as any
    })
    afterEach(() => {
      Date.now = realNow
    })

    it("includes single date with only day of week and month day when in current year", () => {
      const period = singleDateWithDay("2018-12-05T20:00:00+00:00", "UTC")
      expect(period).toBe("Wed, Dec 5")
    })

    it("also includes the year when not in current year", () => {
      const period = singleDateWithDay("2021-12-05T20:00:00+00:00", "UTC")
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
    describe("if displayDayOfWeek param is false (the default), does not include day of week", () => {
      it("includes month day, hour, and both years when years are different", () => {
        const period = dateTimeRange(
          "2021-12-05T20:00:00+00:00",
          "2022-12-30T17:00:00+00:00",
          "UTC"
        )
        expect(period).toBe(
          "Dec 5, 2021 at 8:00pm – Dec 30, 2022 at 5:00pm UTC"
        )
      })

      it("also includes both years when the years are not the present year", () => {
        const period = dateTimeRange(
          "2040-12-05T20:00:00+00:00",
          "2040-12-30T17:00:00+00:00",
          "UTC"
        )
        expect(period).toBe(
          "Dec 5, 2040 at 8:00pm – Dec 30, 2040 at 5:00pm UTC"
        )
      })

      it("does not include year when the years are the present year", () => {
        const period = dateTimeRange(
          "2018-12-05T20:00:00+00:00",
          "2018-12-30T17:00:00+00:00",
          "UTC"
        )
        expect(period).toBe("Dec 5 at 8:00pm – Dec 30 at 5:00pm UTC")
      })

      it("includes the year when both dates are the same day but not the current year", () => {
        const period = dateTimeRange(
          "2019-12-05T20:00:00+00:00",
          "2019-12-05T22:00:00+00:00",
          "UTC"
        )
        expect(period).toBe("Dec 5, 2019 from 8:00 – 10:00pm UTC")
      })

      it("does not include year when both dates are same day and the current year", () => {
        const period = dateTimeRange(
          "2018-12-05T20:00:00+00:00",
          "2018-12-05T22:00:00+00:00",
          "UTC"
        )
        expect(period).toBe("Dec 5 from 8:00 – 10:00pm UTC")
      })
    })

    describe("if displayDayOfWeek param is true includes day of week", () => {
      it("includes month day, hour, and both years when years are different", () => {
        const period = dateTimeRange(
          "2021-12-05T20:00:00+00:00",
          "2022-12-30T17:00:00+00:00",
          "UTC",
          true
        )
        expect(period).toBe(
          "Sun, Dec 5, 2021 at 8:00pm – Fri, Dec 30, 2022 at 5:00pm UTC"
        )
      })

      it("also includes both years when the years are not the present year", () => {
        const period = dateTimeRange(
          "2020-12-05T20:00:00+00:00",
          "2020-12-30T17:00:00+00:00",
          "UTC",
          true
        )
        expect(period).toBe(
          "Sat, Dec 5, 2020 at 8:00pm – Wed, Dec 30, 2020 at 5:00pm UTC"
        )
      })

      it("does not include year when the years are the present year", () => {
        const period = dateTimeRange(
          "2018-12-05T20:00:00+00:00",
          "2018-12-30T17:00:00+00:00",
          "UTC",
          true
        )
        expect(period).toBe("Wed, Dec 5 at 8:00pm – Sun, Dec 30 at 5:00pm UTC")
      })

      it("includes the year when both dates are the same day but not the current year", () => {
        const period = dateTimeRange(
          "2019-12-05T20:00:00+00:00",
          "2019-12-05T22:00:00+00:00",
          "UTC",
          true
        )
        expect(period).toBe("Thu, Dec 5, 2019 from 8:00 – 10:00pm UTC")
      })

      it("does not include the year when the dates are the same day and the same year as the present year", () => {
        const period = dateTimeRange(
          "2018-12-05T20:00:00+00:00",
          "2018-12-05T22:00:00+00:00",
          "UTC",
          true
        )
        expect(period).toBe("Wed, Dec 5 from 8:00 – 10:00pm UTC")
      })

      it("returns the dates with a specific timezone", () => {
        const period = dateTimeRange(
          "2018-12-05T20:00:00+00:00",
          "2018-12-05T22:00:00+00:00",
          "America/Costa_Rica",
          true
        )
        expect(period).toBe("Wed, Dec 5 from 2:00 – 4:00pm CST")
      })
    })
  })

  describe(dateRange, () => {
    it("includes month day and both years when years are different years", () => {
      const period = dateRange("2011-01-01", "2014-04-19", "UTC")
      expect(period).toBe("Jan 1, 2011 – Apr 19, 2014")
    })

    it("includes month twice when years are different even if the same month", () => {
      const period = dateRange("2011-01-01", "2014-01-04", "UTC")
      expect(period).toBe("Jan 1, 2011 – Jan 4, 2014")
    })

    it("only includes the year once if the dates have the same year", () => {
      const period = dateRange("2011-01-01", "2011-04-19", "UTC")
      expect(period).toBe("Jan 1 – Apr 19, 2011")
    })

    it("include only one month if dates have same month and same year", () => {
      const period = dateRange("2011-01-01", "2011-01-19", "UTC")
      expect(period).toBe("Jan 1 – 19, 2011")
    })

    it("does not include the year if both years are the same as the present year", () => {
      const period = dateRange(
        moment.tz("UTC").format("YYYY-01-01"),
        moment.tz("UTC").format("YYYY-01-19"),
        "UTC"
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
        const status = exhibitionStatus(today, future, "UTC")
        expect(status).toBe("Opening today")
      })

      it("states that an exhibition opens tomorrow", () => {
        const status = exhibitionStatus(today.add(1, "d"), future, "UTC")
        expect(status).toBe("Opening tomorrow")
      })

      it("states that an exhibition opens in a few days", () => {
        for (let days = 2; days <= 5; days++) {
          const status = exhibitionStatus(
            today.clone().add(days, "d"),
            future,
            "UTC"
          )
          expect(status).toBe(`Opening in ${days} days`)
        }
      })

      it("returns nothing when it opens in more than a few days", () => {
        const status = exhibitionStatus(today.add(6, "d"), future, "UTC")
        expect(isNull(status)).toBe(true)
      })
    })

    describe("before an exhibition closes", () => {
      let past: Moment = null as any

      beforeEach(() => {
        past = today.clone().subtract(1, "M")
      })

      it("states that an exhibition will close today", () => {
        const status = exhibitionStatus(past, today, "UTC")
        expect(status).toBe("Closing today")
      })

      it("states that an exhibition will close tomorrow", () => {
        const status = exhibitionStatus(past, today.add(1, "d"), "UTC")
        expect(status).toBe("Closing tomorrow")
      })

      it("states that an exhibition is about to close in a few days", () => {
        for (let days = 2; days <= 5; days++) {
          const status = exhibitionStatus(
            past,
            today.clone().add(days, "d"),
            "UTC"
          )
          expect(status).toBe(`Closing in ${days} days`)
        }
      })

      it("returns nothing when it closes in more than a few days", () => {
        const status = exhibitionStatus(past, today.add(6, "d"), "UTC")
        expect(isNull(status)).toBe(true)
      })
    })
  })
})
