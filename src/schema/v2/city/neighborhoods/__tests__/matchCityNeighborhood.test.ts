import {
  matchCityNeighborhood,
  normalizePostalCode,
} from "../matchCityNeighborhood"

const LONDON = "london-united-kingdom"
const nameFor = (citySlug: string, postalCode: string | null) =>
  matchCityNeighborhood(citySlug, postalCode)?.name ?? null

describe("normalizePostalCode", () => {
  it("uppercases and strips whitespace", () => {
    expect(normalizePostalCode("ec1m 5rr")).toEqual("EC1M5RR")
  })

  it("returns an empty string for missing or blank input", () => {
    expect(normalizePostalCode(null)).toEqual("")
    expect(normalizePostalCode(undefined)).toEqual("")
    expect(normalizePostalCode("   ")).toEqual("")
  })

  it("strips a leading country prefix", () => {
    expect(normalizePostalCode("F-75003")).toEqual("75003")
    expect(normalizePostalCode("d-10178")).toEqual("10178")
  })

  it("leaves hyphenated and letter-led codes alone", () => {
    expect(normalizePostalCode("135-891")).toEqual("135-891")
    expect(normalizePostalCode("C1414")).toEqual("C1414")
    expect(normalizePostalCode("M5V 2T6")).toEqual("M5V2T6")
  })
})

describe("matchCityNeighborhood in London", () => {
  it("matches a postcode on its outward code", () => {
    expect(matchCityNeighborhood(LONDON, "EC1M 5RR")).toEqual({
      slug: "farringdon",
      name: "Farringdon",
    })
  })

  it("prefers the longest matching prefix, so W10 is not read as W1", () => {
    expect(nameFor(LONDON, "W10 5RR")).toEqual("Notting Hill")
  })

  it("prefers a specific district over a broader one, so W1D is Soho", () => {
    expect(nameFor(LONDON, "W1D 3QF")).toEqual("Soho")
  })

  it("matches an NW postcode on its own prefix, not as an N postcode", () => {
    // NW6 is deliberately absent from the table, so a loose match via "N1" would be wrong.
    expect(nameFor(LONDON, "NW6 1AB")).toBeNull()
  })

  it("keeps both N and NW postcodes that the table lists", () => {
    expect(nameFor(LONDON, "N1 5RR")).toEqual("North London")
    expect(nameFor(LONDON, "NW1 5RR")).toEqual("North London")
  })

  it("matches a UK district exactly, so SW1 takes SW1A and SW1P but not SW11", () => {
    expect(nameFor(LONDON, "SW1A 2AA")).toEqual("Central London")
    expect(nameFor(LONDON, "SW1P 3JR")).toEqual("Central London")
    expect(nameFor(LONDON, "SW11 1AA")).toEqual("South London")
  })

  it("keeps NW10 out of North London while NW1 stays in", () => {
    expect(nameFor(LONDON, "NW1 5RR")).toEqual("North London")
    expect(nameFor(LONDON, "NW10 5ES")).toBeNull()
  })

  it("returns null for an empty or missing postcode", () => {
    expect(nameFor(LONDON, "")).toBeNull()
    expect(nameFor(LONDON, null)).toBeNull()
  })

  it("returns null for a postcode no entry lists", () => {
    expect(nameFor(LONDON, "ZZ99 9ZZ")).toBeNull()
  })
})

describe("matchCityNeighborhood outside London", () => {
  it("returns null for a city with no table", () => {
    expect(nameFor("dubai-united-arab-emirates", "0000")).toBeNull()
    expect(nameFor("unknown-city", "10011")).toBeNull()
  })

  it("matches Paris arrondissements, including the 16th's 75116 code", () => {
    expect(nameFor("paris-france", "75003")).toEqual("3rd arrondissement")
    expect(nameFor("paris-france", "75116")).toEqual("16th arrondissement")
  })

  it("returns null for a Pantin address outside the périphérique", () => {
    expect(nameFor("paris-france", "93500")).toBeNull()
  })

  it("matches Paris codes that carry an F- country prefix", () => {
    expect(nameFor("paris-france", "F-75003")).toEqual("3rd arrondissement")
  })

  it("matches New York ZIPs and returns null for Jersey City", () => {
    const NEW_YORK = "new-york-ny-usa"
    expect(nameFor(NEW_YORK, "10011")).toEqual("Chelsea")
    expect(nameFor(NEW_YORK, "11201")).toEqual("DUMBO & Brooklyn Heights")
    expect(nameFor(NEW_YORK, "11215")).toEqual("Brooklyn")
    expect(nameFor(NEW_YORK, "07306")).toBeNull()
  })

  it("reads Berlin codes with a D- country prefix or a stray space", () => {
    expect(nameFor("berlin-germany", "D-10178")).toEqual("Mitte")
    expect(nameFor("berlin-germany", "109 69")).toEqual("Kreuzberg")
  })

  it("matches both current and old six-digit Seoul codes", () => {
    expect(nameFor("seoul-south-korea", "03062")).toEqual(
      "Samcheong-dong & Bukchon"
    )
    expect(nameFor("seoul-south-korea", "135-891")).toEqual("Gangnam")
  })
})
