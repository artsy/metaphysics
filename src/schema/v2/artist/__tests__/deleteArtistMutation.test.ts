import gql from "lib/gql"
import { runAuthenticatedQuery, runQuery } from "schema/v2/test/utils"

describe("deleteArtistMutation", () => {
  const mutation = gql`
    mutation {
      deleteArtist(input: { id: "artistID" }) {
        artistOrError {
          __typename
          ... on DeleteArtistSuccess {
            artist {
              displayName
            }
          }
          ... on DeleteArtistFailure {
            mutationError {
              message
            }
          }
        }
      }
    }
  `

  const artist = {
    id: "artistID",
    display_name: "Batman",
  }

  const context = {
    deleteArtistLoader: jest.fn(() => Promise.resolve(artist)),
  }

  it("calls the right loader with artist id", async () => {
    const result = await runAuthenticatedQuery(mutation, context)

    expect(context.deleteArtistLoader).toBeCalledWith("artistID")

    expect(result).toEqual({
      deleteArtist: {
        artistOrError: {
          __typename: "DeleteArtistSuccess",
          artist: {
            displayName: "Batman",
          },
        },
      },
    })
  })

  it("throws error when data loader is missing", async () => {
    const errorResponse = "You need to be signed in to perform this action"

    try {
      await runQuery(mutation)
      throw new Error("An error was not thrown but was expected.")
    } catch (error) {
      // eslint-disable-next-line jest/no-conditional-expect, jest/no-try-expect
      expect(error.message).toEqual(errorResponse)
    }
  })

  it("deletes artist with an error message", async () => {
    const errorContext = {
      deleteArtistLoader: () =>
        Promise.reject(
          new Error(
            `https://stagingapi.artsy.net/api/v1/artist/artistID - {"error":"Artist not found"}`
          )
        ),
    }
    const data = await runAuthenticatedQuery(mutation, errorContext)
    expect(data).toEqual({
      deleteArtist: {
        artistOrError: {
          __typename: "DeleteArtistFailure",
          mutationError: {
            message: "Artist not found",
          },
        },
      },
    })
  })

  it("throws other types of error", async () => {
    const errorContext = {
      deleteArtistLoader: () => {
        throw new Error("ETIMEOUT service unreachable")
      },
    }

    expect.assertions(1)

    await expect(runAuthenticatedQuery(mutation, errorContext)).rejects.toThrow(
      "ETIMEOUT service unreachable"
    )
  })
})
