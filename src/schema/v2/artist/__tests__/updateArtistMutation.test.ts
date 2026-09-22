import gql from "lib/gql"
import { HTTPError } from "lib/HTTPError"
import { runAuthenticatedQuery, runQuery } from "schema/v2/test/utils"

describe("updateArtistMutation", () => {
  const mutation = gql`
    mutation {
      updateArtist(input: { displayName: "Polly Painter", id: "3" }) {
        artistOrError {
          __typename
          ... on UpdateArtistSuccess {
            artist {
              displayName
            }
          }
          ... on UpdateArtistFailure {
            mutationError {
              message
            }
          }
        }
      }
    }
  `

  it("calls the expected loader with correctly formatted params", async () => {
    const mockUpdateArtistLoader = jest.fn(() =>
      Promise.resolve({
        id: "foo",
        display_name: "Polly Painter",
      })
    )

    const context = { updateArtistLoader: mockUpdateArtistLoader }
    const result = await runAuthenticatedQuery(mutation, context)

    expect(mockUpdateArtistLoader).toBeCalledWith("3", {
      display_name: "Polly Painter",
    })

    expect(result).toEqual({
      updateArtist: {
        artistOrError: {
          __typename: "UpdateArtistSuccess",
          artist: {
            displayName: "Polly Painter",
          },
        },
      },
    })
  })

  it("throws error when data loader is missing", async () => {
    const errorResponse =
      "You need to pass a X-Access-Token header to perform this action"

    try {
      await runQuery(mutation)
      throw new Error("An error was not thrown but was expected.")
    } catch (error) {
      // eslint-disable-next-line jest/no-conditional-expect, jest/no-try-expect
      expect(error.message).toEqual(errorResponse)
    }
  })

  it("returns gravity errors", async () => {
    const context = {
      updateArtistLoader: () =>
        Promise.reject(new HTTPError(`Oops`, 500, "Error from API")),
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result).toEqual({
      updateArtist: {
        artistOrError: {
          __typename: "UpdateArtistFailure",
          mutationError: {
            message: "Error from API",
          },
        },
      },
    })
  })
})
