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

    it("throws error when editionSetID provided without artworkID", async () => {
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

      context = {
        meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
        meOrdersLoader: jest.fn(),
      }

      await expect(runAuthenticatedQuery(query, context)).rejects.toThrow(
        "editionSetID requires an arg for artworkID"
      )

      expect(context.meOrdersLoader).not.toHaveBeenCalled()
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

    it("returns orders with null artwork when artwork does not exist", async () => {
      const query = gql`
        query {
          me {
            ordersConnection(first: 10) {
              edges {
                node {
                  internalID
                  code
                  lineItems {
                    artwork {
                      internalID
                    }
                  }
                }
              }
            }
          }
        }
      `

      const order1 = {
        ...baseOrderJson,
        id: "order-1",
        code: "order-code-1",
        line_items: [{ artwork_id: "deleted-artwork" }],
      }

      context = {
        meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
        meOrdersLoader: jest.fn().mockResolvedValue({
          body: [order1],
          headers: { "x-total-count": "1" },
        }),
        artworkLoader: jest
          .fn()
          .mockRejectedValue(new Error("Artwork not found")),
      }

      const result = await runAuthenticatedQuery(query, context)

      expect(result.me.ordersConnection.edges).toHaveLength(1)
      expect(
        result.me.ordersConnection.edges[0].node.lineItems[0].artwork
      ).toBeNull()
    })

    it("handles pagination with mixed existing and missing artworks", async () => {
      const query = gql`
        query {
          me {
            ordersConnection(page: 2, size: 2) {
              edges {
                node {
                  internalID
                  code
                  lineItems {
                    artwork {
                      internalID
                      title
                    }
                  }
                }
              }
              totalCount
            }
          }
        }
      `

      const order1 = {
        ...baseOrderJson,
        id: "order-3",
        code: "order-code-3",
        line_items: [{ artwork_id: "valid-artwork-1" }],
      }
      const order2 = {
        ...baseOrderJson,
        id: "order-4",
        code: "order-code-4",
        line_items: [{ artwork_id: "deleted-artwork" }],
      }

      context = {
        meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
        meOrdersLoader: jest.fn().mockResolvedValue({
          body: [order1, order2],
          headers: { "x-total-count": "10" },
        }),
        artworkLoader: jest.fn((id) => {
          if (id === "valid-artwork-1") {
            return Promise.resolve({
              id: "valid-artwork-1",
              _id: "internal-id-1",
              title: "Valid Art",
            })
          }
          return Promise.reject(new Error("Artwork not found"))
        }),
      }

      const result = await runAuthenticatedQuery(query, context)

      expect(result.me.ordersConnection.edges).toHaveLength(2)
      expect(result.me.ordersConnection.totalCount).toEqual(10)
      expect(
        result.me.ordersConnection.edges[0].node.lineItems[0].artwork
      ).toEqual({
        internalID: "internal-id-1",
        title: "Valid Art",
      })
      expect(
        result.me.ordersConnection.edges[1].node.lineItems[0].artwork
      ).toBeNull()
    })

    it("returns null for artworkOrEditionSet when artwork does not exist", async () => {
      const query = gql`
        query {
          me {
            ordersConnection(first: 10) {
              edges {
                node {
                  internalID
                  code
                  lineItems {
                    artworkOrEditionSet {
                      __typename
                      ... on Artwork {
                        internalID
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `

      const order1 = {
        ...baseOrderJson,
        id: "order-1",
        code: "order-code-1",
        line_items: [{ artwork_id: "deleted-artwork" }],
      }

      context = {
        meLoader: jest.fn().mockResolvedValue({ id: "me-id" }),
        meOrdersLoader: jest.fn().mockResolvedValue({
          body: [order1],
          headers: { "x-total-count": "1" },
        }),
        artworkLoader: jest
          .fn()
          .mockRejectedValue(new Error("Artwork not found")),
      }

      const result = await runAuthenticatedQuery(query, context)

      expect(result.me.ordersConnection.edges).toHaveLength(1)
      expect(
        result.me.ordersConnection.edges[0].node.lineItems[0]
          .artworkOrEditionSet
      ).toBeNull()
    })
  })
})
