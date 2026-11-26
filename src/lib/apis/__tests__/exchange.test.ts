import exchange from "../exchange"
import fetch from "../fetch"

jest.mock("../fetch", () => jest.fn().mockResolvedValue({ body: {} }))

describe("exchange", () => {
  const requestIDs = {
    requestID: "request-id",
    xForwardedFor: "1.2.3.4",
    xOriginalSessionID: "session-id",
  }

  beforeEach(() => {
    ;(fetch as jest.Mock).mockClear()
  })

  it("doesn't forward the request IDs by default", async () => {
    await exchange("me/orders", "token", { requestIDs, userAgent: "Eigen" })

    expect(fetch).toHaveBeenCalledWith(expect.stringMatching(/me\/orders$/), {
      headers: { Authorization: "Bearer token" },
      requestIDs,
      userAgent: "Eigen",
    })
  })

  it("forwards the request IDs as headers when asked to", async () => {
    await exchange("me/orders", "token", {
      forwardRequestIDs: true,
      method: "POST",
      requestIDs,
      userAgent: "Eigen",
    })

    expect(fetch).toHaveBeenCalledWith(expect.stringMatching(/me\/orders$/), {
      headers: {
        Authorization: "Bearer token",
        "x-forwarded-for": "1.2.3.4",
        "x-original-session-id": "session-id",
        "x-request-id": "request-id",
      },
      method: "POST",
      userAgent: "Eigen",
    })
  })
})
