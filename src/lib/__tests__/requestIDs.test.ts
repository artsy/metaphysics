import { headers } from "../requestIDs"
import tracer from "dd-trace"
import { Int64BE } from "int64-buffer"

tracer.init()

describe("request ID headers", () => {
  it("includes datadog data", () => {
    const span = tracer.startSpan("test-headers")
    tracer.scopeManager().activate(span)

    expect(
      headers({ requestID: "requestID", xForwardedFor: "xForwardedFor" })
    ).toEqual({
      "x-request-id": "requestID",
      "x-forwarded-for": "xForwardedFor",
      "x-datadog-trace-id": new Int64BE(
        (span.context() as any).traceId.toBuffer()
      ).toString(),
      "x-datadog-parent-id": new Int64BE(
        (span.context() as any).spanId.toBuffer()
      ).toString(),
    })

    span.finish()
  })
})
