import { HTTPError } from "lib/HTTPError"
import { runAuthenticatedQuery } from "schema/v2/test/utils"
import { ResolverContext } from "types/graphql"

const mutation = `
  mutation {
    generateArtworkDescription(input: { id: "artwork-1" }) {
      artworkDescriptionOrError {
        ... on GenerateArtworkDescriptionSuccess {
          additionalInformation
        }

        ... on GenerateArtworkDescriptionFailure {
          mutationError {
            message
          }
        }
      }
    }
  }
`

describe("generateArtworkDescription", () => {
  describe("valid query", () => {
    const mockGravityResponse = {
      id: "artwork-1",
      additional_information: "AI generated description.",
    }

    let context: Partial<ResolverContext>

    beforeEach(() => {
      context = {
        generateArtworkDescriptionLoader: jest
          .fn()
          .mockResolvedValue(mockGravityResponse),
      }
    })

    it("POSTs the artwork id to Gravity", async () => {
      await runAuthenticatedQuery(mutation, context)

      expect(
        context.generateArtworkDescriptionLoader as jest.Mock
      ).toHaveBeenCalledWith("artwork-1")
    })

    it("returns the generated description", async () => {
      const result = await runAuthenticatedQuery(mutation, context)

      expect(result).toMatchInlineSnapshot(`
        {
          "generateArtworkDescription": {
            "artworkDescriptionOrError": {
              "additionalInformation": "AI generated description.",
            },
          },
        }
      `)
    })
  })

  it("returns failure on Gravity error", async () => {
    const gravityResponseBody = {
      type: "error",
      message: "Unable to generate artwork description",
      detail: {},
    }
    const error = new HTTPError(
      "http://artsy.net - {}",
      422,
      gravityResponseBody
    )
    const context = {
      generateArtworkDescriptionLoader: jest.fn().mockRejectedValue(error),
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result).toMatchInlineSnapshot(`
      {
        "generateArtworkDescription": {
          "artworkDescriptionOrError": {
            "mutationError": {
              "message": "Unable to generate artwork description",
            },
          },
        },
      }
    `)
  })
})
