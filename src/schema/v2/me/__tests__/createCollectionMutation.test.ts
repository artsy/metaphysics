import { runAuthenticatedQuery } from "schema/v2/test/utils"
import { ResolverContext } from "types/graphql"
import { HTTPError } from "lib/HTTPError"

const mutation = `
  mutation {
    createCollection(input: { name: "Dining room", shareableWithPartners: false }) {
      responseOrError {
        ... on CreateCollectionSuccess {
          collection {
            name
            shareableWithPartners
          }
        }

        ... on CreateCollectionFailure {
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

describe("createCollection", () => {
  describe("valid query", () => {
    const mockGravityResponse = {
      id: "id",
      name: "Dining room",
      shareable_with_partners: false,
    }

    let context: Partial<ResolverContext>

    beforeEach(() => {
      context = {
        createCollectionLoader: jest
          .fn()
          .mockResolvedValue(mockGravityResponse),
      }
    })

    it("passes correct args to Gravity", async () => {
      await runAuthenticatedQuery(mutation, context)

      expect(context.createCollectionLoader as jest.Mock).toHaveBeenCalledWith({
        user_id: "user-42",
        name: "Dining room",
        saves: true,
        shareable_with_partners: false,
      })
    })

    it("returns success response", async () => {
      const result = await runAuthenticatedQuery(mutation, context)

      expect(result).toMatchInlineSnapshot(`
        {
          "createCollection": {
            "responseOrError": {
              "collection": {
                "name": "Dining room",
                "shareableWithPartners": false,
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
      "http://artsy.net - {}",
      400,
      gravityResponseBody
    )
    const context = {
      createCollectionLoader: jest.fn().mockRejectedValue(error),
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result).toMatchInlineSnapshot(`
      {
        "createCollection": {
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
