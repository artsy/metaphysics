import { getDemandRankDisplayText } from "../getDemandRank"

describe("getDemandRankDisplayText", () => {
  it("returns 'Less Active Demand' when the rank is less than 0.4", () => {
    expect(getDemandRankDisplayText(0.3)).toEqual("Less Active Demand")
  })

  it("returns 'Moderate Demand' when the rank is less than 0.7", () => {
    expect(getDemandRankDisplayText(0.57)).toEqual("Moderate Demand")
  })

  it("returns 'Active Demand' when the rank is less than 0.9", () => {
    expect(getDemandRankDisplayText(0.88)).toEqual("Active Demand")
  })

  it("returns 'High Demand' when the rank is over 0.9", () => {
    expect(getDemandRankDisplayText(0.95)).toEqual("High Demand")
  })
})
