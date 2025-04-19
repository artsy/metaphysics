import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("DeleteArtworkMutation", () => {
  const mutation = gql`
    mutation {
      deleteArtwork(input: { id: "artwork123" }) {
        artworkOrError {
          __typename
          ... on DeleteArtworkSuccess {
            artwork {
              slug
              title
            }
          }
        }
      }
    }
  `

  it("deletes an artwork", async () => {
    const context = {
      deleteArtworkLoader: () =>
        Promise.resolve({
          id: "artwork123",
          title: "Test Artwork",
        }),
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result).toEqual({
      deleteArtwork: {
        artworkOrError: {
          __typename: "DeleteArtworkSuccess",
          artwork: {
            slug: "artwork123",
            title: "Test Artwork",
          },
        },
      },
    })
  })
})
