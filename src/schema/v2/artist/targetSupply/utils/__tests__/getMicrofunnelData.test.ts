import { getMicrofunnelData } from "../getMicrofunnelData"

describe("getConsignmentData", () => {
  it("returns undefined if artist href does not exist in CSV", () => {
    expect(getMicrofunnelData("/artist/not-found")).toEqual(undefined)
  })
})
