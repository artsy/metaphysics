import { runQuery } from "test/utils"

jest.mock("lib/apis/fetch", () => jest.fn())

describe("SystemTime type", () => {
  const systemTimeData = {
    time: "2018-07-02 20:58:58 UTC",
    day: 2,
    wday: 1,
    month: 7,
    year: 2018,
    hour: 20,
    min: 58,
    sec: 58,
    dst: false,
    unix: 1530565138,
    utc_offset: 0,
    zone: "UTC",
    iso8601: "2018-07-02T20:58:58Z",
  }

  const rootValue = {
    systemTimeLoader: sinon.stub().returns(Promise.resolve(systemTimeData)),
  }

  it("fetches gravity's system time", async () => {
    const query = `
      {
        system {
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
      }
    `

    const { system } = await runQuery(query, rootValue)
    expect(system.time.day).toEqual(2)
    expect(system.time.iso8601).toEqual("2018-07-02T20:58:58Z")
  })
})
