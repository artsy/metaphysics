import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("AddArtworkToPartnerShowMutation", () => {
  const mutation = gql`
    mutation {
      addArtworkToPartnerShow(
        input: {
          showId: "show123"
          artworkId: "artwork123"
          partnerId: "partner123"
        }
      ) {
        showOrError {
          __typename
          ... on AddArtworkToPartnerShowSuccess {
            show {
              internalID
              name
              status
            }
          }
        }
      }
    }
  `

  it("adds an artwork to a partner show", async () => {
    const context = {
      addArtworkToPartnerShowLoader: () =>
        Promise.resolve({
          _id: "show123",
          name: "Sample Show",
          status: "running",
        }),
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result).toEqual({
      addArtworkToPartnerShow: {
        showOrError: {
          __typename: "AddArtworkToPartnerShowSuccess",
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
