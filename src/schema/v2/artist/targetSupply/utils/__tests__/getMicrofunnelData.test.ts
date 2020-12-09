import { getArtistMicrofunnelMetadata } from "../getMicrofunnelData"

describe("getConsignmentData", () => {
  it("returns undefined if artist href does not exist in CSV", () => {
    expect(getArtistMicrofunnelMetadata("/artist/not-found")).toEqual(undefined)
  })
})
