import dateField, { formatDate } from "schema/v2/fields/date"

describe("formatDate", () => {
  const rawDate = "2020-12-31T12:00:00+00:00"
  const format = "M/D/YYYY h:mm Z"
  it("returns unformatted, UTC time if no timezone or format is specified", () => {
    expect(formatDate(rawDate)).toBe("2020-12-31T12:00:00+00:00")
  })

  it("returns formatted UTC time if no timezone is specified", () => {
    expect(formatDate(rawDate, format)).toBe("12/31/2020 12:00 +00:00")
  })

  it("returns unformatted, local time if no format is specified", () => {
    expect(formatDate(rawDate, null, "America/Boise")).toBe(
      "2020-12-31T05:00:00-07:00"
    )
    expect(formatDate(rawDate, null, "Pacific/Fiji")).toBe(
      "2021-01-01T01:00:00+13:00"
    )
  })

  it("provides formatted, local time if timezone and format are specified", () => {
    expect(formatDate(rawDate, format, "America/Boise")).toBe(
      "12/31/2020 5:00 -07:00"
    )
    expect(formatDate(rawDate, format, "Pacific/Fiji")).toBe(
      "1/1/2021 1:00 +13:00"
    )
  })
})

describe("dateField", () => {
  it("should return null for a missing date", () => {
    expect(
      dateField.resolve?.(
        {},
        { timezone: "America/Boise" },
        {} as any,
        { fieldName: "date" } as any
      )
    ).toBeNull()
  })
})
