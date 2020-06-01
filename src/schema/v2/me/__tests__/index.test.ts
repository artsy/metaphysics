/* eslint-disable promise/always-return */
import { runAuthenticatedQuery, runQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

describe("me/index", () => {
  const query = gql`
    query {
      me {
        name
        email
        paddleNumber
        identityVerified
        hasSecondFactorEnabled
      }
    }
  `

  it("loads data from meLoader", () => {
    const body = {
      name: "Test User",
      email: "test@email.com",
      paddle_number: "123456",
      identity_verified: true,
      second_factor_enabled: true,
    }

    return runAuthenticatedQuery(query, {
      meLoader: () => Promise.resolve(body),
    }).then((data) => {
      expect(data).toEqual({
        me: {
          name: "Test User",
          email: "test@email.com",
          paddleNumber: "123456",
          identityVerified: true,
          hasSecondFactorEnabled: true,
        },
      })
    })
  })

  describe("hasQualifiedCreditCards", () => {
    const creditCardQuery = gql`
      query {
        me {
          hasQualifiedCreditCards
        }
      }
    `
    it("returns true for has_qualified_credit_cards if one is returned from the me/credit_cards endpoint", () => {
      const creditCardsResponse = [
        {
          id: "aabbccddee",
          brand: "Visa",
          name: "Test User",
          last_digits: "4242",
          created_at: "2018-04-25T14:53:44.000Z",
          expiration_month: 3,
          expiration_year: 2022,
          deactivated_at: null,
          created_by_admin: null,
          created_by_trusted_client: null,
          qualified_for_bidding: true,
          provider: "Stripe",
          address_zip_check: "pass",
          address_line1_check: "pass",
          cvc_check: "pass",
        },
      ]

      return runAuthenticatedQuery(creditCardQuery, {
        meCreditCardsLoader: () =>
          Promise.resolve({
            body: creditCardsResponse,
            headers: { "x-total-count": "1" },
          }),
      }).then((data) => {
        expect(data).toEqual({ me: { hasQualifiedCreditCards: true } })
      })
    })

    it("returns false for has_qualified_credit_cards if none are returned from the me/credit_cards endpoint", () => {
      const creditCardsResponse = []

      return runAuthenticatedQuery(creditCardQuery, {
        meCreditCardsLoader: () =>
          Promise.resolve({
            body: creditCardsResponse,
            headers: { "x-total-count": "0" },
          }),
      }).then((data) => {
        expect(data).toEqual({
          me: {
            hasQualifiedCreditCards: false,
          },
        })
      })
    })
  })

  describe("hasCreditCards", () => {
    const creditCardQuery = gql`
      query {
        me {
          hasCreditCards
        }
      }
    `
    it("returns true for has_credit_cards if one is returned from the me/credit_cards endpoint", () => {
      const creditCardsResponse = [
        {
          id: "aabbccddee",
          brand: "Visa",
          name: "Test User",
          last_digits: "4242",
          created_at: "2018-04-25T14:53:44.000Z",
          expiration_month: 3,
          expiration_year: 2022,
          deactivated_at: null,
          created_by_admin: null,
          created_by_trusted_client: null,
          qualified_for_bidding: false,
          provider: "Stripe",
          address_zip_check: "pass",
          address_line1_check: "pass",
          cvc_check: "pass",
        },
      ]

      return runAuthenticatedQuery(creditCardQuery, {
        meCreditCardsLoader: () =>
          Promise.resolve({
            body: creditCardsResponse,
            headers: { "x-total-count": "0" },
          }),
      }).then((data) => {
        expect(data).toEqual({ me: { hasCreditCards: true } })
      })
    })

    it("returns false for has_qualified_credit_cards if none are returned from the me/credit_cards endpoint", () => {
      const creditCardsResponse = []

      return runAuthenticatedQuery(creditCardQuery, {
        meCreditCardsLoader: () =>
          Promise.resolve({
            body: creditCardsResponse,
            headers: { "x-total-count": "0" },
          }),
      }).then((data) => {
        expect(data).toEqual({ me: { hasCreditCards: false } })
      })
    })
  })

  describe("unreadNotificationsCount", () => {
    const countQuery = gql`
      query {
        me {
          unreadNotificationsCount
        }
      }
    `

    it("returns the number of unread notifications", () => {
      return runAuthenticatedQuery(countQuery, {
        notificationsFeedLoader: () => Promise.resolve({ total_unread: 12 }),
      }).then((data) => {
        expect(data).toEqual({ me: { unreadNotificationsCount: 12 } })
      })
    })

    it("handles an unauthorized request", () => {
      return runQuery(countQuery, {
        notificationsFeedLoader: () => Promise.resolve({ total_unread: null }),
      }).catch((error) => {
        expect(error.message).toEqual(
          "You need to be signed in to perform this action"
        )
      })
    })

    it("handles a null from gravity", () => {
      return runAuthenticatedQuery(countQuery, {
        notificationsFeedLoader: () => Promise.resolve({ total_unread: null }),
      }).then((data) => {
        expect(data).toEqual({ me: { unreadNotificationsCount: 0 } })
      })
    })
  })

  describe("canRequestEmailConfirmation", () => {
    it("returns whatever boolean is returned at `can_request_email_confirmation` in the Gravity response", async () => {
      const minimalMeLoaderResponse = {
        can_request_email_confirmation: false,
      }
      const query = gql`
        query {
          me {
            canRequestEmailConfirmation
          }
        }
      `

      const response = await runAuthenticatedQuery(query, {
        meLoader: () => Promise.resolve(minimalMeLoaderResponse),
      })

      expect(response).toEqual({ me: { canRequestEmailConfirmation: false } })
    })
  })
})
