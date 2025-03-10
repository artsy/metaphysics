import gql from "lib/gql"
import { HTTPError } from "lib/HTTPError"
import { runAuthenticatedQuery, runQuery } from "schema/v2/test/utils"

describe("createArtistMutation", () => {
  const mutation = gql`
    mutation {
      createArtist(
        input: { displayName: "Andy Manner", isPersonalArtist: true }
      ) {
        artistOrError {
          __typename
          ... on CreateArtistSuccess {
            artist {
              displayName
            }
          }
          ... on CreateArtistFailure {
            mutationError {
              message
            }
          }
        }
      }
    }
  `

  it("calls the expected loader with correctly formatted params", async () => {
    const mockCreateArtistLoader = jest.fn(() =>
      Promise.resolve({
        id: "artistID",
        display_name: "Andy Manner",
      })
    )

    const context = { createArtistLoader: mockCreateArtistLoader }
    const result = await runAuthenticatedQuery(mutation, context)

    expect(mockCreateArtistLoader).toBeCalledWith({
      display_name: "Andy Manner",
      is_personal_artist: true,
    })

    expect(result).toEqual({
      createArtist: {
        artistOrError: {
          __typename: "CreateArtistSuccess",
          artist: {
            displayName: "Andy Manner",
          },
        },
      },
    })
  })

  it("creates the partner artist record when partnerID is provided", async () => {
    const mockCreateArtistLoader = jest.fn(() =>
      Promise.resolve({
        id: "artistID",
        display_name: "Andy Manner",
      })
    )
    const mockCreatePartnerArtistLoader = jest.fn(() =>
      Promise.resolve({
        id: "partnerArtistID",
        artist_id: "artistID",
      })
    )

    const context = {
      createArtistLoader: mockCreateArtistLoader,
      createPartnerArtistLoader: mockCreatePartnerArtistLoader,
    }

    const mutationWithPartner = gql`
      mutation {
        createArtist(
          input: {
            displayName: "Andy Manner"
            isPersonalArtist: true
            partnerID: "partnerID"
          }
        ) {
          artistOrError {
            __typename
            ... on CreateArtistSuccess {
              artist {
                displayName
              }
            }
            ... on CreateArtistFailure {
              mutationError {
                message
              }
            }
          }
        }
      }
    `
    const result = await runAuthenticatedQuery(mutationWithPartner, context)

    expect(mockCreateArtistLoader).toBeCalledWith({
      display_name: "Andy Manner",
      is_personal_artist: true,
    })

    expect(mockCreatePartnerArtistLoader).toBeCalledWith(
      {
        artistID: "artistID",
        partnerID: "partnerID",
      },
      { represented_by: false }
    )

    expect(result).toEqual({
      createArtist: {
        artistOrError: {
          __typename: "CreateArtistSuccess",
          artist: {
            displayName: "Andy Manner",
          },
        },
      },
    })
  })

  it("throws error when data loader is missing", async () => {
    const errorResponse = "You need to be logged in to perform this action"

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
      createArtistLoader: () =>
        Promise.reject(new HTTPError(`Forbidden`, 403, "Gravity Error")),
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result).toEqual({
      createArtist: {
        artistOrError: {
          __typename: "CreateArtistFailure",
          mutationError: {
            message: "Gravity Error",
          },
        },
      },
    })
  })
})
