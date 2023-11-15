/* eslint-disable promise/always-return */
import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

const mutation = gql`
  mutation {
    createPartnerOffer(input: { artwork_id: "xyz321", price_minor: "4000" }) {
      partnerOfferOrError {
        __typename
        ... on createPartnerOfferSuccess {
          partnerOffer {
            artworkId
            createdAt
            currency
            endAt
            partnerId
            priceMinor
            userIds
          }
        }
        ... on createPartnerOfferFailure {
          mutationError {
            message
          }
        }
      }
    }
  }
`

describe("Create a partner offer for users", () => {
  describe("when succesfull", () => {
    const partnerOffer = {
      id: "xyz321",
      body: "Still a great collector",
      created_at: "2022-09-30T12:00:00+00:00",
    }

    const context = {
      createPartnerOfferLoader: () => Promise.resolve(partnerOffer),
    }

    it("creates a partner offer request", async () => {
      const data = await runAuthenticatedQuery(mutation, context)
      expect(data).toEqual({
        createPartnerOffer: {
          partnerOfferOrError: {
            __typename: "createPartnerOfferSuccess",
            partnerOffer: {
              body: "Still a great collector",
              createdAt: "2022-09-30T12:00:00+00:00",
            },
          },
        },
      })
    })
  })

  describe("when failure", () => {
    it("return an error", async () => {
      const context = {
        createPartnerOfferLoader: () =>
          Promise.reject(
            new Error(
              `https://stagingapi.artsy.net/api/v1/user/abc123/admin_notes - {"type":"error","message":"User not found"}`
            )
          ),
      }

      const response = await runAuthenticatedQuery(mutation, context)

      expect(response).toEqual({
        createPartnerOffer: {
          partnerOfferOrError: {
            __typename: "createPartnerOfferFailure",
            mutationError: {
              message: "User not found",
            },
          },
        },
      })
    })
  })
})
