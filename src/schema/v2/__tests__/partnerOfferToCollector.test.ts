import { runAuthenticatedQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

describe("PartnerOfferToCollector", () => {
  const partnerOffer = {
    id: "partner-offer-1",
    artwork_id: "artwork-1",
    active: true,
    available: true,
    price_currency: "USD",
    price_with_discount_minor: 1736000,
    created_at: "2024-02-27T19:01:51.461Z",
    end_at: "2024-03-01T19:01:51.457Z",
  }

  const mePartnerOffersLoader = () =>
    Promise.resolve({
      body: [partnerOffer],
      headers: { "x-total-count": "1" },
    })

  const query = gql`
    query {
      me {
        partnerOffersConnection(first: 10) {
          edges {
            node {
              internalID
              isPurchased
            }
          }
        }
      }
    }
  `

  describe("isPurchased (fallback)", () => {
    it("is true when Exchange returns a purchased-state order for the offer", async () => {
      const meOrdersLoader = jest.fn(() =>
        Promise.resolve({
          body: [{ id: "order-1" }],
          headers: {},
        })
      )

      const response = await runAuthenticatedQuery(query, {
        meLoader: () => Promise.resolve({}),
        mePartnerOffersLoader,
        meOrdersLoader,
      })

      expect(meOrdersLoader).toHaveBeenCalledWith({
        partner_offer_ids: "partner-offer-1",
        buyer_state: "SUBMITTED,APPROVED,COMPLETED",
      })

      expect(
        response.me.partnerOffersConnection.edges[0].node.isPurchased
      ).toBe(true)
    })

    it("is false when Exchange returns no orders for the offer", async () => {
      const meOrdersLoader = () => Promise.resolve({ body: [], headers: {} })

      const response = await runAuthenticatedQuery(query, {
        meLoader: () => Promise.resolve({}),
        mePartnerOffersLoader,
        meOrdersLoader,
      })

      expect(
        response.me.partnerOffersConnection.edges[0].node.isPurchased
      ).toBe(false)
    })

    it("is false when the orders loader rejects", async () => {
      const meOrdersLoader = () => Promise.reject(new Error("Exchange down"))

      const response = await runAuthenticatedQuery(query, {
        meLoader: () => Promise.resolve({}),
        mePartnerOffersLoader,
        meOrdersLoader,
      })

      expect(
        response.me.partnerOffersConnection.edges[0].node.isPurchased
      ).toBe(false)
    })
  })
})
