import { runAuthenticatedQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

describe("Partner inquiry stats", () => {
  const query = gql`
    {
      partner(id: "example-partner") {
        inquiryResponseRate
        inquiryResponseTime
      }
    }
  `

  const partnerLoader = jest.fn().mockReturnValue(
    Promise.resolve({
      id: "example-partner",
      _id: "partner-internal-id",
    })
  )

  it("returns inquiryResponseRate and inquiryResponseTime from Impulse /stats", async () => {
    const partnerInquiryStatsLoader = jest.fn().mockResolvedValue({
      response_rate: 85.5,
      response_time_in_minutes: 120,
    })

    const { partner } = await runAuthenticatedQuery(query, {
      partnerLoader,
      partnerInquiryStatsLoader,
      userID: "user-id",
      accessToken: "access-token",
    })

    expect(partnerInquiryStatsLoader).toHaveBeenCalledWith({
      to_id: "partner-internal-id",
      to_type: "Partner",
      days_in_past: 90,
    })
    expect(partner.inquiryResponseRate).toBe(85.5)
    expect(partner.inquiryResponseTime).toBe(120)
  })

  it("returns null when partnerInquiryStatsLoader is not available", async () => {
    const { partner } = await runAuthenticatedQuery(query, {
      partnerLoader,
      partnerInquiryStatsLoader: undefined,
      userID: "user-id",
      accessToken: "access-token",
    })

    expect(partner.inquiryResponseRate).toBeNull()
    expect(partner.inquiryResponseTime).toBeNull()
  })

  it("returns null when stats loader throws an error", async () => {
    const partnerInquiryStatsLoader = jest
      .fn()
      .mockRejectedValue(new Error("Failed to fetch stats"))

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {})

    const { partner } = await runAuthenticatedQuery(query, {
      partnerLoader,
      partnerInquiryStatsLoader,
      userID: "user-id",
      accessToken: "access-token",
    })

    expect(partner.inquiryResponseRate).toBeNull()
    expect(partner.inquiryResponseTime).toBeNull()

    consoleSpy.mockRestore()
  })

  it("returns null when stats response is missing fields", async () => {
    const partnerInquiryStatsLoader = jest.fn().mockResolvedValue({})

    const { partner } = await runAuthenticatedQuery(query, {
      partnerLoader,
      partnerInquiryStatsLoader,
      userID: "user-id",
      accessToken: "access-token",
    })

    expect(partner.inquiryResponseRate).toBeNull()
    expect(partner.inquiryResponseTime).toBeNull()
  })
})
