import gql from "lib/gql"
import { HTTPError } from "lib/HTTPError"
import { runAuthenticatedQuery, runQuery } from "schema/v2/test/utils"

describe("updateArtistSocialsMutation", () => {
  const mutation = gql`
    mutation {
      updateArtistSocials(input: { id: "3", instagramHandle: "@artsy" }) {
        artistOrError {
          __typename
          ... on UpdateArtistSocialsSuccess {
            artist {
              instagramHandle
            }
          }
          ... on UpdateArtistSocialsFailure {
            mutationError {
              message
              statusCode
            }
          }
        }
      }
    }
  `

  it("calls the expected loader with correctly formatted params", async () => {
    const mockUpdateArtistSocialsLoader = jest.fn(() =>
      Promise.resolve({
        id: "foo",
        instagram_handle: "artsy",
      })
    )

    const context = {
      updateArtistSocialsLoader: mockUpdateArtistSocialsLoader,
    }
    const result = await runAuthenticatedQuery(mutation, context)

    expect(mockUpdateArtistSocialsLoader).toBeCalledWith("3", {
      instagram_handle: "@artsy",
    })

    expect(result).toEqual({
      updateArtistSocials: {
        artistOrError: {
          __typename: "UpdateArtistSocialsSuccess",
          artist: {
            instagramHandle: "artsy",
          },
        },
      },
    })
  })

  it("sends an empty string when clearing the handle", async () => {
    const clearMutation = gql`
      mutation {
        updateArtistSocials(input: { id: "3", instagramHandle: null }) {
          artistOrError {
            ... on UpdateArtistSocialsSuccess {
              artist {
                instagramHandle
              }
            }
          }
        }
      }
    `

    const mockUpdateArtistSocialsLoader = jest.fn(() =>
      Promise.resolve({
        id: "foo",
        instagram_handle: null,
      })
    )

    const context = {
      updateArtistSocialsLoader: mockUpdateArtistSocialsLoader,
    }
    const result = await runAuthenticatedQuery(clearMutation, context)

    expect(mockUpdateArtistSocialsLoader).toBeCalledWith("3", {
      instagram_handle: "",
    })

    expect(result).toEqual({
      updateArtistSocials: {
        artistOrError: {
          artist: {
            instagramHandle: null,
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

  it("surfaces a gravity 403 as a failure with its status code", async () => {
    const context = {
      updateArtistSocialsLoader: () =>
        Promise.reject(
          new HTTPError(`Oops`, 403, JSON.stringify({ error: "Forbidden" }))
        ),
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result).toEqual({
      updateArtistSocials: {
        artistOrError: {
          __typename: "UpdateArtistSocialsFailure",
          mutationError: {
            message: "Forbidden",
            statusCode: 403,
          },
        },
      },
    })
  })
})
