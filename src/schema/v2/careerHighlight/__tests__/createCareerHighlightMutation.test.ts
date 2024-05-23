import gql from "lib/gql"
import { HTTPError } from "lib/HTTPError"
import { runAuthenticatedQuery, runQuery } from "schema/v2/test/utils"

describe("createCareerHighlightMutation", () => {
  const mutation = gql`
    mutation {
      createCareerHighlight(
        input: {
          artistId: "andy-warhol"
          partnerId: "artsy-hq"
          solo: true
          collected: false
          group: false
        }
      ) {
        careerHighlightOrError {
          __typename
          ... on CreateCareerHighlightSuccess {
            careerHighlight {
              venue
            }
          }
          ... on CreateCareerHighlightFailure {
            mutationError {
              message
            }
          }
        }
      }
    }
  `

  const artistCareerHighlight = {
    artistId: "xyz",
    partnerId: "artsy-hq",
    solo: true,
    group: false,
    collected: false,
    venue: "Artsy HQ",
    id: "xyz",
  }

  const context = {
    createArtistCareerHighlightLoader: jest.fn(() =>
      Promise.resolve(artistCareerHighlight)
    ),
  }

  it("calls the right loader with artist id", async () => {
    const result = await runAuthenticatedQuery(mutation, context)

    expect(context.createArtistCareerHighlightLoader).toBeCalledWith({
      artist_id: "andy-warhol",
      partner_id: "artsy-hq",
      solo: true,
      collected: false,
      group: false,
    })

    expect(result).toEqual({
      createCareerHighlight: {
        careerHighlightOrError: {
          __typename: "CreateCareerHighlightSuccess",
          careerHighlight: {
            venue: "Artsy HQ",
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
      throw new Error(
        "You need to pass a X-Access-Token header to perform this action."
      )
    } catch (error) {
      // eslint-disable-next-line jest/no-conditional-expect, jest/no-try-expect
      expect(error.message).toEqual(errorResponse)
    }
  })

  it("returns gravity errors", async () => {
    const context = {
      createArtistCareerHighlightLoader: () =>
        Promise.reject(new HTTPError(`Forbidden`, 403, "Gravity Error")),
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result).toEqual({
      createCareerHighlight: {
        careerHighlightOrError: {
          __typename: "CreateCareerHighlightFailure",
          mutationError: {
            message: "Gravity Error",
          },
        },
      },
    })
  })
})
