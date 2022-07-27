import gql from "lib/gql"
import { runQuery, runAuthenticatedQuery } from "schema/v2/test/utils"

const mutation = gql`
  mutation {
    mergeArtists(
      input: {
        goodId: "abc123"
        badIds: ["def456", "ghi789"]
        overrides: { birthday: "def456", deathday: "ghi789" }
      }
    ) {
      mergeArtistsResponseOrError {
        __typename
        ... on MergeArtistsSuccess {
          artist {
            internalID
            slug
          }
        }
        ... on MergeArtistsFailure {
          mutationError {
            message
          }
        }
      }
    }
  }
`

describe("performing an artist merger", () => {
  it("requires an access token", async () => {
    await expect(runQuery(mutation)).rejects.toThrow(
      "You need to be signed in to perform this action"
    )
  })

  describe("upon success", () => {
    it("returns the merged artist record", async () => {
      const gravityResponse = {
        _id: "abc123",
        id: "some-artist",
      }

      const context = {
        mergeArtistLoader: () => Promise.resolve(gravityResponse),
      }

      const response = await runAuthenticatedQuery(mutation, context)

      expect(response).toEqual({
        mergeArtists: {
          mergeArtistsResponseOrError: {
            __typename: "MergeArtistsSuccess",
            artist: {
              internalID: "abc123",
              slug: "some-artist",
            },
          },
        },
      })
    })
  })

  describe("upon error", () => {
    it("returns the Gravity error message", async () => {
      const context = {
        mergeArtistLoader: () =>
          Promise.reject(
            new Error(
              `https://stagingapi.artsy.net/api/v1/artists/merge - {"type":"error","message":"Artist(s) Not Found"}`
            )
          ),
      }

      const response = await runAuthenticatedQuery(mutation, context)

      expect(response).toEqual({
        mergeArtists: {
          mergeArtistsResponseOrError: {
            __typename: "MergeArtistsFailure",
            mutationError: {
              message: "Artist(s) Not Found",
            },
          },
        },
      })
    })
  })
})
