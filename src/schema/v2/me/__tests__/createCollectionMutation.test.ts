import { runAuthenticatedQuery } from "schema/v2/test/utils"
import { ResolverContext } from "types/graphql"
import { HTTPError } from "lib/HTTPError"

const mutation = `
  mutation {
    createCollection(input: { name: "Dining room" }) {
      responseOrError {
        ... on CreateCollectionSuccess {
          collection {
            name
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
      })
    })

    it("returns success response", async () => {
      const result = await runAuthenticatedQuery(mutation, context)

      expect(result).toMatchInlineSnapshot(`
        Object {
          "createCollection": Object {
            "responseOrError": Object {
              "collection": Object {
                "name": "Dining room",
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
      Object {
        "createCollection": Object {
          "responseOrError": Object {
            "mutationError": Object {
              "fieldErrors": Array [
                Object {
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
