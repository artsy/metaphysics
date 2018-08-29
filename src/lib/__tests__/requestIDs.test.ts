import { headers } from "../requestIDs"

jest.mock("dd-trace", () => {
  return {
    scopeManager: () => ({
      active: () => ({
        span: () => ({
          context: () => ({
            spanId: "span123",
            traceId: "trace123",
          }),
        }),
      }),
    }),
  }
})

describe("request ID headers", () => {
  it("includes datadog data", () => {
    expect(
      headers({ requestID: "requestID", xForwardedFor: "xForwardedFor" })
    ).toEqual({
      "x-request-id": "requestID",
      "x-forwarded-for": "xForwardedFor",
      "x-datadog-trace-id": "trace123",
      "x-datadog-parent-id": "span123",
    })
  })
})
