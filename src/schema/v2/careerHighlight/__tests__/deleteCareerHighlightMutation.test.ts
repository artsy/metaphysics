import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("deleteCareerHighlightMutation", () => {
  const mutation = gql`
    mutation {
      deleteCareerHighlight(input: { id: "xyz" }) {
        careerHighlightOrError {
          __typename
          ... on DeleteCareerHighlightSuccess {
            careerHighlight {
              venue
            }
          }
          ... on DeleteCareerHighlightFailure {
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
  }

  const context = {
    deleteArtistCareerHighlightLoader: jest.fn(() =>
      Promise.resolve(artistCareerHighlight)
    ),
  }

  it("calls the right loader with artist id", async () => {
    const result = await runAuthenticatedQuery(mutation, context)

    expect(context.deleteArtistCareerHighlightLoader).toBeCalledWith("xyz")

    expect(result).toEqual({
      deleteCareerHighlight: {
        careerHighlightOrError: {
          __typename: "DeleteCareerHighlightSuccess",
          careerHighlight: {
            venue: "Artsy HQ",
          },
        },
      },
    })
  })
})
