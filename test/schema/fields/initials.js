import { isNull } from "lodash"
import { initials } from "schema/fields/initials"

describe("initials", () => {
  it("returns the initials for a string with normal orthography", () => {
    expect(initials("Richard Prince")).toBe("RP")
    expect(initials("Harm van den Dorpel")).toBe("HD")
  })

  it("returns initials for single words", () => {
    expect(initials("Prince")).toBe("P")
    expect(initials("prince")).toBe("P")
  })

  it("returns initials for strings with unconventional orthography", () => {
    expect(initials("e e cummings")).toBe("EEC")
    expect(initials("e e cummings", 2)).toBe("EE")
  })

  it("is a little weird for numbers", () => {
    expect(initials("247365")).toBe("2")
  })

  it("returns null when the value is undefined", () => {
    expect(isNull(initials())).toBe(true)
  })
})
