/* eslint-disable promise/always-return */
import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

const mutation = gql`
  mutation {
    createPartnerOffer(
      input: { artwork_id: "xyz321", discount_percentage: 10, note: "hi!" }
    ) {
      partnerOfferOrError {
        __typename
        ... on createPartnerOfferSuccess {
          partnerOffer {
            artworkId
            createdAt
            endAt
            id
            partnerId
            discountPercentage
            note
            userIds
          }
          partner {
            name
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
      artwork_id: "artwork_id",
      created_at: "2022-09-30T12:00:00+00:00",
      end_at: "2022-10-29T12:00:00+00:00",
      partner_id: "partner_id",
      discount_percentage: 10,
      note: "hi!",
      user_ids: ["user_id1", "user_id2"],
    }

    const partner = {
      name: "partner_name",
    }

    const context = {
      createPartnerOfferLoader: () => Promise.resolve(partnerOffer),
      partnerAllLoader: () => Promise.resolve(partner),
    }

    it("creates a partner offer request", async () => {
      const data = await runAuthenticatedQuery(mutation, context)
      expect(data).toEqual({
        createPartnerOffer: {
          partnerOfferOrError: {
            __typename: "createPartnerOfferSuccess",
            partnerOffer: {
              artworkId: "artwork_id",
              createdAt: "2022-09-30T12:00:00+00:00",
              discountPercentage: 10,
              note: "hi!",
              endAt: "2022-10-29T12:00:00+00:00",
              id: "xyz321",
              partnerId: "partner_id",
              userIds: ["user_id1", "user_id2"],
            },
            partner: {
              name: "partner_name",
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
              `https://stagingapi.artsy.net/api/v1/partner_offer - {"type":"error","message":"Artwork not found"}`
            )
          ),
      }

      const response = await runAuthenticatedQuery(mutation, context)

      expect(response).toEqual({
        createPartnerOffer: {
          partnerOfferOrError: {
            __typename: "createPartnerOfferFailure",
            mutationError: {
              message: "Artwork not found",
            },
          },
        },
      })
    })
  })
})
