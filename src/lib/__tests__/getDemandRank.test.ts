import { getDemandRank } from "../getDemandRank"

describe("getDemandRank", () => {
  it("returns 'Less Active Demand' when the rank is less than 0.4", () => {
    expect(getDemandRank(0.3)).toEqual("Less Active Demand")
  })

  it("returns 'Moderate Demand' when the rank is less than 0.7", () => {
    expect(getDemandRank(0.57)).toEqual("Moderate Demand")
  })

  it("returns 'Active Demand' when the rank is less than 0.9", () => {
    expect(getDemandRank(0.88)).toEqual("Active Demand")
  })

  it("returns 'High Demand' when the rank is over 0.9", () => {
    expect(getDemandRank(0.95)).toEqual("High Demand")
  })
})
