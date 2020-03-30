import { getMicrofunnelData } from "../getMicrofunnelData"
import { artistMicrofunnelFixture } from "schema/v2/artist/targetSupply/__tests__/fixtures/artistMicrofunnelFixture"

describe("getConsignmentData", () => {
  it("returns undefined if artist href does not exist in CSV", () => {
    expect(getMicrofunnelData("/artist/not-found")).toEqual(undefined)
  })

  it("converts CSVtoJSON data into expected format", () => {
    expect(getMicrofunnelData("/artist/alex-katz")).toEqual(
      artistMicrofunnelFixture
    )
  })
})
