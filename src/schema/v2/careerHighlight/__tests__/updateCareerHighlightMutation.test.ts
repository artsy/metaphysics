import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("updateCareerHighlightMutation", () => {
  const mutation = gql`
    mutation {
      updateCareerHighlight(input: { id: "xyz", solo: true }) {
        careerHighlightOrError {
          __typename
          ... on UpdateCareerHighlightSuccess {
            careerHighlight {
              venue
              solo
            }
          }
          ... on UpdateCareerHighlightFailure {
            mutationError {
              message
            }
          }
        }
      }
    }
  `

  const artistCareerHighlight = {
    id: "xyz",
    venue: "Artsy HQ",
    solo: true,
  }

  const context = {
    updateArtistCareerHighlightLoader: jest.fn(() =>
      Promise.resolve(artistCareerHighlight)
    ),
  }

  it("calls the right loader with artist id", async () => {
    const result = await runAuthenticatedQuery(mutation, context)

    expect(context.updateArtistCareerHighlightLoader).toBeCalledWith("xyz", {
      solo: true,
    })

    expect(result).toEqual({
      updateCareerHighlight: {
        careerHighlightOrError: {
          __typename: "UpdateCareerHighlightSuccess",
          careerHighlight: {
            venue: "Artsy HQ",
            solo: true,
          },
        },
      },
    })
  })
})
