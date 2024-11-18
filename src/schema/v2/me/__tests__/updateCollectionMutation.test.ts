import { runAuthenticatedQuery } from "schema/v2/test/utils"
import { ResolverContext } from "types/graphql"
import { HTTPError } from "lib/HTTPError"

const mutation = `
  mutation {
    updateCollection(input: { id: "collection-id", name: "Dining room", shareableWithPartners: true }) {
      responseOrError {
        ... on UpdateCollectionSuccess {
          collection {
            name
            shareableWithPartners
          }
        }

        ... on UpdateCollectionFailure {
          mutationError {
            fieldErrors {
              name
              message
            }
          }
        }
      }
    }
  }
`

describe("updateCollection", () => {
  describe("valid query", () => {
    const mockGravityResponse = {
      id: "collection-id",
      name: "Dining room",
      shareable_with_partners: true,
    }

    let context: Partial<ResolverContext>

    beforeEach(() => {
      context = {
        updateCollectionLoader: jest
          .fn()
          .mockResolvedValue(mockGravityResponse),
      }
    })

    it("passes correct args to Gravity", async () => {
      await runAuthenticatedQuery(mutation, context)

      expect(context.updateCollectionLoader as jest.Mock).toHaveBeenCalledWith(
        "collection-id",
        {
          user_id: "user-42",
          name: "Dining room",
          shareable_with_partners: true,
        }
      )
    })

    it("returns success response", async () => {
      const result = await runAuthenticatedQuery(mutation, context)

      expect(result).toMatchInlineSnapshot(`
        {
          "updateCollection": {
            "responseOrError": {
              "collection": {
                "name": "Dining room",
                "shareableWithPartners": true,
              },
            },
          },
        }
      `)
    })
  })

  it("returns failure when something went wrong", async () => {
    const gravityResponseBody = {
      detail: {
        name: ["You already have a list with this name"],
      },
      message: "Name You already have a list with this name.",
      type: "param_error",
    }
    const error = new HTTPError(
      "http://artsy.net - Bad Request",
      400,
      gravityResponseBody
    )
    const context = {
      updateCollectionLoader: jest.fn().mockRejectedValue(error),
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result).toMatchInlineSnapshot(`
      {
        "updateCollection": {
          "responseOrError": {
            "mutationError": {
              "fieldErrors": [
                {
                  "message": "You already have a list with this name",
                  "name": "name",
                },
              ],
            },
          },
        },
      }
    `)
  })
})
