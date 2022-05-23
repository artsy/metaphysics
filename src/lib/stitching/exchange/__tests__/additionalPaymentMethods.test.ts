import gql from "lib/gql"
import { Response } from "node-fetch"
import { runQuery } from "schema/v2/test/utils"
import { ResolverContext } from "types/graphql"

jest.mock("../link")
const mockFetch = require("../link").mockFetch as jest.Mock<any>

describe("additionalPaymentMethods", () => {
  const partner = {
    wire_transfer_enabled: true,
  }

  const partnerLoader = jest.fn(() => Promise.resolve(partner))

  const context: Partial<ResolverContext> = {
    partnerLoader,
  }
  const query = gql`
    query {
      commerceOrder(code: "abc") {
        additionalPaymentMethods
      }
    }
  `

  describe.each([
    [true, "Partner", "BuyOrder", true],
    [true, "Partner", "OfferOrder", false],
    [false, "Partner", "BuyOrder", false],
    [false, "Partner", "OfferOrder", false],

    [true, "User", "BuyOrder", false],
    [true, "User", "OfferOrder", false],
    [false, "User", "BuyOrder", false],
    [false, "User", "OfferOrder", false],
  ])("wire transfer", (wireTransferEnabled, sellerType, orderType, result) => {
    it(`${
      result ? "includes" : "doesn't include"
    } wire_transfer for ${orderType} if wire transfer: ${
      wireTransferEnabled ? "enabled" : "disabled"
    }, seller type: ${sellerType}`, async () => {
      partner.wire_transfer_enabled = wireTransferEnabled
      const orderFixture = {
        data: {
          order: {
            __typename: orderType,
            seller: {
              id: "111",
              __typename: sellerType,
            },
          },
        },
      }

      mockFetch.mockImplementationOnce(() => {
        return Promise.resolve(new Response(JSON.stringify(orderFixture)))
      })

      const response = await runQuery(query, context)
      expect(
        response.commerceOrder.additionalPaymentMethods.includes(
          "wire_transfer"
        )
      ).toEqual(result)
    })
  })
})
