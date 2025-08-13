import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("AssignArtistToPartnerMutation", () => {
  const mutation = gql`
    mutation {
      assignArtistToPartner(
        input: {
          artistID: "artist-123"
          partnerID: "partner-456"
          featured: true
          remoteImageUrl: "https://example.com/image.jpg"
        }
      ) {
        partnerArtistOrError {
          __typename
          ... on AssignArtistToPartnerSuccess {
            partnerArtist {
              internalID
            }
            artist {
              internalID
            }
            partner {
              name
            }
          }
          ... on AssignArtistToPartnerFailure {
            mutationError {
              message
            }
          }
        }
      }
    }
  `

  it("assigns an artist to a partner successfully", async () => {
    const partnerArtistResponse = {
      id: "partner-artist-789",
      artist: {
        id: "artist-123",
        _id: "artist-123",
      },
      partner: {
        name: "Test Partner",
      },
    }

    const context = {
      createPartnerArtistLoader: () => Promise.resolve(partnerArtistResponse),
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result).toEqual({
      assignArtistToPartner: {
        partnerArtistOrError: {
          __typename: "AssignArtistToPartnerSuccess",
          partnerArtist: {
            internalID: "partner-artist-789",
          },
          artist: {
            internalID: "artist-123",
          },
          partner: {
            name: "Test Partner",
          },
        },
      },
    })
  })

  it("throws an error when the loader fails", async () => {
    const context = {
      createPartnerArtistLoader: () =>
        Promise.reject(new Error("Artist not found")),
    }

    await expect(runAuthenticatedQuery(mutation, context)).rejects.toThrow(
      "Artist not found"
    )
  })

  it("throws an error when user is not authenticated", async () => {
    const context: any = {
      createPartnerArtistLoader: null,
    }

    await expect(runAuthenticatedQuery(mutation, context)).rejects.toThrow(
      "You need to be logged in to perform this action"
    )
  })
})
