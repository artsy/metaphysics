import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("RepositionArtworksInPartnerShowMutation", () => {
  const mutation = gql`
    mutation {
      repositionArtworksInPartnerShow(
        input: {
          showId: "show123"
          partnerId: "partner456"
          artworkIds: ["artwork1", "artwork2", "artwork3"]
        }
      ) {
        showOrError {
          __typename
          ... on RepositionArtworksInPartnerShowSuccess {
            show {
              internalID
              name
              status
            }
          }
          ... on RepositionArtworksInPartnerShowFailure {
            mutationError {
              message
            }
          }
        }
      }
    }
  `

  it("repositions artworks in a partner show", async () => {
    const context = {
      repositionArtworksInPartnerShowLoader: (identifiers, data) => {
        // Test that we're sending the right data
        expect(identifiers).toEqual({
          showId: "show123",
          partnerId: "partner456",
        })
        expect(data).toEqual({
          artwork_ids: ["artwork1", "artwork2", "artwork3"],
        })

        return Promise.resolve({
          _id: "show123",
          name: "Sample Show",
          status: "running",
        })
      },
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result).toEqual({
      repositionArtworksInPartnerShow: {
        showOrError: {
          __typename: "RepositionArtworksInPartnerShowSuccess",
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
