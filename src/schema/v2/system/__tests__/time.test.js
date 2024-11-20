import { runQuery } from "schema/v2/test/utils"

describe.skip("SystemTime type", () => {
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
            utcOffset
            zone
            iso8601
          }
        }
      }
    `

    const { system } = await runQuery(query, {})
    expect(system.time.day).toEqual(2)
    expect(system.time.iso8601).toEqual("2018-07-02T20:58:58Z")
  })
})
