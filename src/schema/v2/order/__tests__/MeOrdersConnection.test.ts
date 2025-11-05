/* eslint-disable promise/always-return */
import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"
import { baseOrderJson } from "./support"

let context

describe("Me", () => {
  describe("ordersConnection", () => {
    it("returns a paginated list of orders for the current user", async () => {
      const query = gql`
        query {
          me {
            ordersConnection(first: 10) {
              edges {
                node {
                  internalID
                  code
                  buyerState
                }
              }
              totalCount
            }
          }
        }
      `

      const order1 = { ...baseOrderJson, id: "order-1", code: "order-code-1" }
      const order2 = { ...baseOrderJson, id: "order-2", code: "order-code-2" }

      context = {
        meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
        meOrdersLoader: jest.fn().mockResolvedValue({
          body: [order1, order2],
          headers: { "x-total-count": "2" },
        }),
      }

      const result = await runAuthenticatedQuery(query, context)

      expect(context.meOrdersLoader).toHaveBeenCalledWith({
        page: 1,
        size: 10,
      })
      expect(result.me.ordersConnection.edges).toHaveLength(2)
      expect(result.me.ordersConnection.totalCount).toEqual(2)
      expect(result.me.ordersConnection.edges[0].node.internalID).toEqual(
        "order-1"
      )
      expect(result.me.ordersConnection.edges[1].node.internalID).toEqual(
        "order-2"
      )
    })

    it("supports pagination with page and size parameters", async () => {
      const query = gql`
        query {
          me {
            ordersConnection(page: 2, size: 5) {
              edges {
                node {
                  internalID
                }
              }
              totalCount
            }
          }
        }
      `

      const order1 = { ...baseOrderJson, id: "order-6" }

      context = {
        meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
        meOrdersLoader: jest.fn().mockResolvedValue({
          body: [order1],
          headers: { "x-total-count": "10" },
        }),
      }

      const result = await runAuthenticatedQuery(query, context)

      expect(context.meOrdersLoader).toHaveBeenCalledWith({
        page: 2,
        size: 5,
      })
      expect(result.me.ordersConnection.totalCount).toEqual(10)
    })

    it("filters by artworkID", async () => {
      const query = gql`
        query {
          me {
            ordersConnection(artworkID: "artwork-1", first: 10) {
              edges {
                node {
                  internalID
                }
              }
            }
          }
        }
      `

      const order1 = { ...baseOrderJson, id: "order-1" }

      context = {
        meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
        meOrdersLoader: jest.fn().mockResolvedValue({
          body: [order1],
          headers: { "x-total-count": "1" },
        }),
      }

      await runAuthenticatedQuery(query, context)

      expect(context.meOrdersLoader).toHaveBeenCalledWith({
        page: 1,
        size: 10,
        artwork_id: "artwork-1",
      })
    })

    it("filters by editionSetID with artworkID", async () => {
      const query = gql`
        query {
          me {
            ordersConnection(
              editionSetID: "edition-set-1"
              artworkID: "artwork-1"
              first: 10
            ) {
              edges {
                node {
                  internalID
                }
              }
            }
          }
        }
      `

      const order1 = { ...baseOrderJson, id: "order-1" }

      context = {
        meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
        meOrdersLoader: jest.fn().mockResolvedValue({
          body: [order1],
          headers: { "x-total-count": "1" },
        }),
      }

      await runAuthenticatedQuery(query, context)

      expect(context.meOrdersLoader).toHaveBeenCalledWith({
        page: 1,
        size: 10,
        edition_set_id: "edition-set-1",
        artwork_id: "artwork-1",
      })
    })

    it("does not filter by editionSetID without artworkID", async () => {
      const query = gql`
        query {
          me {
            ordersConnection(editionSetID: "edition-set-1", first: 10) {
              edges {
                node {
                  internalID
                }
              }
            }
          }
        }
      `

      const order1 = { ...baseOrderJson, id: "order-1" }

      context = {
        meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
        meOrdersLoader: jest.fn().mockResolvedValue({
          body: [order1],
          headers: { "x-total-count": "1" },
        }),
      }

      await runAuthenticatedQuery(query, context)

      expect(context.meOrdersLoader).toHaveBeenCalledWith({
        page: 1,
        size: 10,
      })
    })

    it("filters by single buyerState", async () => {
      const query = gql`
        query {
          me {
            ordersConnection(buyerState: SUBMITTED, first: 10) {
              edges {
                node {
                  internalID
                  buyerState
                }
              }
            }
          }
        }
      `

      const order1 = {
        ...baseOrderJson,
        id: "order-1",
        buyer_state: "submitted",
      }

      context = {
        meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
        meOrdersLoader: jest.fn().mockResolvedValue({
          body: [order1],
          headers: { "x-total-count": "1" },
        }),
      }

      const result = await runAuthenticatedQuery(query, context)

      expect(context.meOrdersLoader).toHaveBeenCalledWith({
        page: 1,
        size: 10,
        buyer_state: "SUBMITTED",
      })
      expect(result.me.ordersConnection.edges[0].node.buyerState).toEqual(
        "SUBMITTED"
      )
    })

    it("filters by multiple buyerStates", async () => {
      const query = gql`
        query {
          me {
            ordersConnection(buyerState: [SUBMITTED, APPROVED], first: 10) {
              edges {
                node {
                  internalID
                }
              }
            }
          }
        }
      `

      const order1 = {
        ...baseOrderJson,
        id: "order-1",
        buyer_state: "submitted",
      }
      const order2 = {
        ...baseOrderJson,
        id: "order-2",
        buyer_state: "approved",
      }

      context = {
        meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
        meOrdersLoader: jest.fn().mockResolvedValue({
          body: [order1, order2],
          headers: { "x-total-count": "2" },
        }),
      }

      await runAuthenticatedQuery(query, context)

      expect(context.meOrdersLoader).toHaveBeenCalledWith({
        page: 1,
        size: 10,
        buyer_state: "SUBMITTED,APPROVED",
      })
    })

    it("combines multiple filters", async () => {
      const query = gql`
        query {
          me {
            ordersConnection(
              artworkID: "artwork-1"
              buyerState: SUBMITTED
              first: 10
            ) {
              edges {
                node {
                  internalID
                }
              }
            }
          }
        }
      `

      const order1 = {
        ...baseOrderJson,
        id: "order-1",
        buyer_state: "submitted",
      }

      context = {
        meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
        meOrdersLoader: jest.fn().mockResolvedValue({
          body: [order1],
          headers: { "x-total-count": "1" },
        }),
      }

      await runAuthenticatedQuery(query, context)

      expect(context.meOrdersLoader).toHaveBeenCalledWith({
        page: 1,
        size: 10,
        artwork_id: "artwork-1",
        buyer_state: "SUBMITTED",
      })
    })

    it("returns empty connection when no orders found", async () => {
      const query = gql`
        query {
          me {
            ordersConnection(artworkID: "nonexistent", first: 10) {
              edges {
                node {
                  internalID
                }
              }
              totalCount
            }
          }
        }
      `

      context = {
        meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
        meOrdersLoader: jest.fn().mockResolvedValue({
          body: [],
          headers: { "x-total-count": "0" },
        }),
      }

      const result = await runAuthenticatedQuery(query, context)

      expect(result.me.ordersConnection.edges).toEqual([])
      expect(result.me.ordersConnection.totalCount).toEqual(0)
    })

    it("returns null when meOrdersLoader is not available", async () => {
      const query = gql`
        query {
          me {
            ordersConnection(first: 10) {
              edges {
                node {
                  internalID
                }
              }
            }
          }
        }
      `

      context = {
        meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
        meOrdersLoader: null,
      }

      const result = await runAuthenticatedQuery(query, context)

      expect(result.me.ordersConnection).toBeNull()
    })
  })
})
