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
})
