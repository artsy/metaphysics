import { runAuthenticatedQuery } from "schema/v2/test/utils"
import gql from "lib/gql"
import { HTTPError } from "lib/HTTPError"

describe("User", () => {
  describe("userAlreadyExists", () => {
    it("returns true if a user exists", async () => {
      const foundUser = {
        id: "123456",
        _id: "000012345",
        name: "foo bar",
        pin: "3141",
        paddle_number: "314159",
      }

      const userByEmailLoader = (data) => {
        if (data) {
          return Promise.resolve(foundUser)
        }
        throw new Error("Unexpected invocation")
      }

      const query = gql`
        {
          user(email: "foo@bar.com") {
            pin
            paddleNumber
            userAlreadyExists
          }
        }
      `

      const { user } = await runAuthenticatedQuery(query, { userByEmailLoader })
      expect(user.pin).toEqual("3141")
      expect(user.paddleNumber).toEqual("314159")
      expect(user.userAlreadyExists).toEqual(true)
    })

    it("returns false if user is not found by email", async () => {
      const notFoundUser = { error: "User Not Found" }
      const error = new HTTPError(notFoundUser.error, 404)
      const userByEmailLoader = (data) => {
        if (data) {
          return Promise.resolve(notFoundUser)
        }
        throw error
      }
      const query = gql`
        {
          user(email: "nonexistentuser@bar.com") {
            userAlreadyExists
          }
        }
      `
      const { user } = await runAuthenticatedQuery(query, { userByEmailLoader })
      expect(user.userAlreadyExists).toEqual(false)
    })
  })

  describe("savedArtworksConnection", () => {
    const query = `
        {
          user(id: "blah") {
            savedArtworksConnection(first: 10) {
              totalCount
              edges {
                node {
                  title
                }
              }
            }
          }
        }
      `

    const user = {
      id: "blah",
    }

    const artworks = [
      {
        title: "Black Cat in Repose",
      },
      {
        title: "Sleeping Cat in Sun",
      },
    ]

    let context

    beforeEach(() => {
      context = {
        userByIDLoader: () => {
          return Promise.resolve(user)
        },
        savedArtworksLoader: () => {
          return Promise.resolve({
            body: artworks,
            headers: { "x-total-count": "2" },
          })
        },
      }
    })

    it("returns saved artworks for a user", async () => {
      const {
        user: {
          savedArtworksConnection: { totalCount, edges },
        },
      } = await runAuthenticatedQuery(query, context)

      expect(totalCount).toEqual(2)
      expect(edges.length).toEqual(2)
      expect(edges[0]).toEqual({
        node: {
          title: "Black Cat in Repose",
        },
      })
      expect(edges[1]).toEqual({
        node: {
          title: "Sleeping Cat in Sun",
        },
      })
    })

    it("returns an empty connection w/ no error if the gravity request 404's", async () => {
      context.savedArtworksLoader = () => {
        return Promise.reject(new HTTPError("Not Found", 404))
      }

      const {
        user: {
          savedArtworksConnection: { totalCount, edges },
        },
      } = await runAuthenticatedQuery(query, context)

      expect(totalCount).toEqual(0)
      expect(edges).toEqual([])
    })

    it("throws an error if the gravity request errors and it's not a 404", async () => {
      context.savedArtworksLoader = () => {
        return Promise.reject(new HTTPError("Cats in the server room", 500))
      }

      expect.assertions(1)

      try {
        await runAuthenticatedQuery(query, context)
        throw new Error("An error was not thrown but was expected to throw.")
      } catch (error) {
        // eslint-disable-next-line jest/no-conditional-expect, jest/no-try-expect
        expect(error.message).toEqual("Cats in the server room")
      }
    })
  })

  describe("push notification settings", () => {
    it("returns push notification settings for a user", async () => {
      const foundUser = {
        id: "123456",
        _id: "000012345",
        name: "foo bar",
        pin: "3141",
        paddle_number: "314159",
        receive_purchase_notification: false,
        receive_outbid_notification: false,
        receive_lot_opening_soon_notification: false,
        receive_sale_opening_closing_notification: false,
        receive_new_works_notification: true,
        receive_new_sales_notification: false,
        receive_promotion_notification: false,
        receive_order_notification: true,
        receive_viewing_room_notification: true,
      }

      const userByEmailLoader = (data) => {
        if (data) {
          return Promise.resolve(foundUser)
        }
        throw new Error("Unexpected invocation")
      }

      const query = gql`
        {
          user(email: "foo@bar.com") {
            pin
            paddleNumber
            userAlreadyExists
            receivePurchaseNotification
            receiveOutbidNotification
            receiveLotOpeningSoonNotification
            receiveSaleOpeningClosingNotification
            receiveNewWorksNotification
            receiveNewSalesNotification
            receivePromotionNotification
            receiveOrderNotification
            receiveViewingRoomNotification
          }
        }
      `

      const { user } = await runAuthenticatedQuery(query, { userByEmailLoader })
      expect(user.pin).toEqual("3141")
      expect(user.paddleNumber).toEqual("314159")
      expect(user.userAlreadyExists).toEqual(true)
      expect(user.receivePurchaseNotification).toEqual(false)
      expect(user.receiveOutbidNotification).toEqual(false)
      expect(user.receiveLotOpeningSoonNotification).toEqual(false)
      expect(user.receiveSaleOpeningClosingNotification).toEqual(false)
      expect(user.receiveNewWorksNotification).toEqual(true)
      expect(user.receiveNewSalesNotification).toEqual(false)
      expect(user.receivePromotionNotification).toEqual(false)
      expect(user.receiveOrderNotification).toEqual(true)
      expect(user.receiveViewingRoomNotification).toEqual(true)
    })
  })

  describe("interestsConnection", () => {
    it("returns user interests", async () => {
      const query = `
        {
          user(id: "blah") {
            interestsConnection(first: 10) {
              edges {
                body
                category
                createdByAdmin
                node {
                  __typename
                  ... on Gene {
                    name
                  }
                  ... on Artist {
                    name
                  }
                }
              }
            }
          }
        }
      `

      const user = {
        id: "blah",
      }

      const interests = [
        {
          body: "Told an admin they collected",
          owner_type: "UserSaleProfile",
          category: "collected_before",
          interest: {
            birthday: 2001,
            name: "Catty Artist",
          },
        },
        {
          body: null,
          owner_type: "CollectorProfile",
          category: "interested_in_collecting",
          interest: {
            name: "Catty Gene",
          },
        },
      ]

      const context = {
        userByIDLoader: () => {
          return Promise.resolve(user)
        },
        userInterestsLoader: () => {
          return Promise.resolve({
            body: interests,
            headers: { "x-total-count": "2" },
          })
        },
      }

      const {
        user: {
          interestsConnection: { edges },
        },
      } = await runAuthenticatedQuery(query, context)

      expect(edges.length).toEqual(2)

      expect(edges[0]).toEqual({
        body: "Told an admin they collected",
        category: "COLLECTED_BEFORE",
        createdByAdmin: true,
        node: {
          __typename: "Artist",
          name: "Catty Artist",
        },
      })

      expect(edges[1]).toEqual({
        body: null,
        category: "INTERESTED_IN_COLLECTING",
        createdByAdmin: false,
        node: {
          __typename: "Gene",
          name: "Catty Gene",
        },
      })
    })
  })

  describe("follows", () => {
    it("returns user follows", async () => {
      const query = `
        {
          user(id: "abc") {
            follows {
              artistsConnection(first: 10) {
                edges {
                  node {
                    name
                  }
                }
              }
              genesConnection(first: 10) {
                edges {
                  node {
                    name
                  }
                }
              }
            }
          }
        }
      `

      const user = {
        id: "abc",
      }

      const artistFollows = [
        {
          name: "Frank Stella",
        },
        {
          name: "Ed Ruscha",
        },
      ]

      const geneFollows = [
        {
          name: "Emerging Art",
        },
      ]

      const context = {
        userByIDLoader: () => {
          return Promise.resolve(user)
        },
        userArtistFollowsLoader: () => {
          return Promise.resolve({
            body: artistFollows,
            headers: { "x-total-count": "2" },
          })
        },
        userGeneFollowsLoader: () => {
          return Promise.resolve({
            body: geneFollows,
            headers: { "x-total-count": "1" },
          })
        },
      }

      const {
        user: {
          follows: { artistsConnection, genesConnection },
        },
      } = await runAuthenticatedQuery(query, context)

      expect(artistsConnection.edges.length).toEqual(2)
      expect(genesConnection.edges.length).toEqual(1)

      expect(artistsConnection.edges[0]).toEqual({
        node: {
          name: "Frank Stella",
        },
      })

      expect(artistsConnection.edges[1]).toEqual({
        node: {
          name: "Ed Ruscha",
        },
      })

      expect(genesConnection.edges[0]).toEqual({
        node: {
          name: "Emerging Art",
        },
      })
    })
  })
})
