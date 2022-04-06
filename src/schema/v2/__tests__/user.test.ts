import { runAuthenticatedQuery } from "schema/v2/test/utils"
import gql from "lib/gql"
import { HTTPError } from "lib/HTTPError"

describe("User", () => {
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

  it("falls back to email for name if name is blank", async () => {
    const foundUser = {
      id: "123456",
      _id: "000012345",
      name: null,
      email: "foo@bar.org",
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
          name
        }
      }
    `

    const { user } = await runAuthenticatedQuery(query, { userByEmailLoader })
    expect(user.name).toEqual("foo@bar.org")
  })

  it("falls back to empty string for name if name and e-mail are blank", async () => {
    // This is what returned from Gravity when a non-admin user hits /v1/user/:id
    const foundUser = {
      id: "123456",
      _id: "000012345",
      name: null,
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
          name
        }
      }
    `

    const { user } = await runAuthenticatedQuery(query, { userByEmailLoader })
    expect(user.name).toEqual("")
  })

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
  })
})
