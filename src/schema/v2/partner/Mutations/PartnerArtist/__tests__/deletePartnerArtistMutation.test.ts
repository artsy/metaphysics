import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("DeletePartnerArtistMutation", () => {
  const mutation = gql`
    mutation {
      deletePartnerArtist(
        input: { partnerId: "partner123", artistId: "artist123" }
      ) {
        partnerArtistOrError {
          __typename
          ... on DeletePartnerArtistSuccess {
            partner {
              name
            }
          }
        }
      }
    }
  `

  it("deletes a partner artist", async () => {
    const context = {
      deletePartnerArtistLoader: () =>
        Promise.resolve({
          id: "partner-artist-123",
        }),
      partnerLoader: () => Promise.resolve({ name: "Test Partner" }),
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result).toEqual({
      deletePartnerArtist: {
        partnerArtistOrError: {
          __typename: "DeletePartnerArtistSuccess",
          partner: {
            name: "Test Partner",
          },
        },
      },
    })
  })
})
