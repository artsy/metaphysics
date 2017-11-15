import { runQuery } from "test/utils"

describe("Time type", () => {
  it("returns the system time", () => {
    const fullQuery = `
    {
      time {
        day
        wday
        month
        year
        hour
        min
        sec
        dst
        unix
        utc_offset
        zone
        iso8601
      }
    }
    `
    const rootValue = {
      systemLoader: () =>
        Promise.resolve({
          day: 15,
          wday: 3,
          month: 11,
          year: 2017,
          hour: 19,
          min: 45,
          sec: 3,
          dst: false,
          unix: 1510775103,
          utc_offset: 0,
          zone: "UTC",
          iso8601: "2017-11-15T19:45:03Z",
        }),
    }

    expect.assertions(1)
    return runQuery(fullQuery, rootValue).then(response => {
      expect(response).toMatchSnapshot()
    })
  })
})
