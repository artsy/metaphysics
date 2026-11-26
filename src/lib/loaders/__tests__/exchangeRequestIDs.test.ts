import { exchangeLoaders } from "lib/loaders/loaders_with_authentication/exchange"
import exchange from "lib/apis/exchange"
import gravity from "lib/apis/gravity"

jest.mock("lib/apis/exchange", () => jest.fn())
jest.mock("lib/apis/gravity", () => jest.fn())

describe("Exchange loaders and request ID headers", () => {
  const requestIDs = {
    requestID: "request-id",
    xForwardedFor: "1.2.3.4",
    xOriginalSessionID: "session-id",
  }

  const buildLoaders = () => {
    ;(gravity as jest.Mock).mockResolvedValue({ body: { token: "token" } })
    ;(exchange as jest.Mock).mockReset().mockResolvedValue({ body: {} })
    return exchangeLoaders("access-token", { requestIDs }) as any
  }

  const exchangeOptions = () => (exchange as jest.Mock).mock.calls[0][2]

  it("existing loaders don't ask to forward them", async () => {
    const loaders = buildLoaders()

    await loaders.meOrderSubmitLoader("order-id")

    expect(exchangeOptions()).not.toHaveProperty("forwardRequestIDs")
  })

  it.each([
    ["meOrderCreateLoader", (loaders) => loaders.meOrderCreateLoader({})],
    [
      "sellerOrderActionLoader",
      (loaders) =>
        loaders.sellerOrderActionLoader({ orderId: "o", action: "approve" }),
    ],
    [
      "sellerOfferActionLoader",
      (loaders) =>
        loaders.sellerOfferActionLoader({ offerId: "o", action: "accept" }),
    ],
  ])("%s forwards them", async (_name, call) => {
    const loaders = buildLoaders()

    await call(loaders)

    expect(exchangeOptions()).toMatchObject({
      forwardRequestIDs: true,
      requestIDs,
    })
  })
})
