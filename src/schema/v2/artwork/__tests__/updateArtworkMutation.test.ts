import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("UpdateArtworkMutation", () => {
  const mutation = gql`
    mutation {
      updateArtwork(input: { id: "25", availability: "sold" }) {
        artworkOrError {
          __typename
          ... on updateArtworkSuccess {
            artwork {
              availability
            }
          }
          ... on updateArtworkFailure {
            mutationError {
              message
            }
          }
        }
      }
    }
  `

  it("updates an artwork", async () => {
    const context = {
      updateArtworkLoader: () =>
        Promise.resolve({
          id: "foo",
          availability: "sold",
        }),
    }

    const artwork = await runAuthenticatedQuery(mutation, context)

    expect(artwork).toEqual({
      updateArtwork: {
        artworkOrError: {
          __typename: "updateArtworkSuccess",
          artwork: { availability: "sold" },
        },
      },
    })
  })

  describe("when failure", () => {
    it("return an error", async () => {
      const context = {
        updateArtworkLoader: () =>
          Promise.reject(
            new Error(
              `https://stagingapi.artsy.net/api/v1/some-endpoint - {"type":"error","message":"Error from API"}`
            )
          ),
      }

      const response = await runAuthenticatedQuery(mutation, context)

      expect(response).toEqual({
        updateArtwork: {
          artworkOrError: {
            __typename: "updateArtworkFailure",
            mutationError: {
              message: "Error from API",
            },
          },
        },
      })
    })
  })
})
