import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("RepositionPartnerArtistArtworksMutation", () => {
  const mutation = gql`
    mutation {
      repositionPartnerArtistArtworks(
        input: {
          partnerId: "partner123"
          artistId: "artist123"
          artworkIds: ["artwork1", "artwork2", "artwork3"]
        }
      ) {
        partnerOrError {
          __typename
          ... on RepositionPartnerArtistArtworksSuccess {
            partner {
              name
            }
          }
        }
      }
    }
  `

  it("repositions artworks for a partner artist", async () => {
    const context = {
      repositionPartnerArtistArtworksLoader: () =>
        Promise.resolve({
          id: "123",
        }),
      partnerLoader: () => Promise.resolve({ name: "Test Partner" }),
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result).toEqual({
      repositionPartnerArtistArtworks: {
        partnerOrError: {
          __typename: "RepositionPartnerArtistArtworksSuccess",
          partner: {
            name: "Test Partner",
          },
        },
      },
    })
  })
})
