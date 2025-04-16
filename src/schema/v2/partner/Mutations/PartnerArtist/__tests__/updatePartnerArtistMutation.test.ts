import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("UpdatePartnerArtistMutation", () => {
  const mutation = gql`
    mutation {
      updatePartnerArtist(
        input: {
          id: "partner-artist-123"
          remoteImageUrl: "https://example.com/image.jpg"
        }
      ) {
        partnerArtistOrError {
          __typename
          ... on UpdatePartnerArtistSuccess {
            partner {
              name
            }
          }
        }
      }
    }
  `

  it("updates a partner artist", async () => {
    const partnerArtistResponse = {
      id: "partner-artist-123",
      partner: {
        name: "Test Partner",
      },
    }

    const context = {
      updatePartnerArtistLoader: () => Promise.resolve(partnerArtistResponse),
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result).toEqual({
      updatePartnerArtist: {
        partnerArtistOrError: {
          __typename: "UpdatePartnerArtistSuccess",
          partner: {
            name: "Test Partner",
          },
        },
      },
    })
  })
})
