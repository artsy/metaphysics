import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("RemoveArtworkFromPartnerShowMutation", () => {
  const mutation = gql`
    mutation {
      removeArtworkFromPartnerShow(
        input: {
          showId: "show123"
          artworkId: "artwork123"
          partnerId: "partner123"
        }
      ) {
        showOrError {
          __typename
          ... on RemoveArtworkFromPartnerShowSuccess {
            show {
              internalID
              name
              status
            }
          }
          ... on RemoveArtworkFromPartnerShowFailure {
            mutationError {
              message
            }
          }
        }
      }
    }
  `

  it("removes an artwork from a partner show", async () => {
    const context = {
      removeArtworkFromPartnerShowLoader: () =>
        Promise.resolve({
          _id: "show123",
          name: "Sample Show",
          status: "running",
        }),
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result).toEqual({
      removeArtworkFromPartnerShow: {
        showOrError: {
          __typename: "RemoveArtworkFromPartnerShowSuccess",
          show: {
            internalID: "show123",
            name: "Sample Show",
            status: "running",
          },
        },
      },
    })
  })
})
