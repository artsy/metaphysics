import { runAuthenticatedQuery } from "schema/v2/test/utils"
import { ResolverContext } from "types/graphql"

const mutation = `
  mutation {
    deleteCollection(input: { id: "123-abc" }) {
      responseOrError {
        ... on DeleteCollectionSuccess {
          collection {
            internalID
            name
          }
        }

        ... on DeleteCollectionFailure {
          mutationError {
            message
          }
        }
      }
    }
  }
`

describe("deleteCollection", () => {
  describe("valid query", () => {
    const mockGravityResponse = {
      id: "123-abc",
      name: "Dining room",
    }

    let context: Partial<ResolverContext>

    beforeEach(() => {
      context = {
        deleteCollectionLoader: jest
          .fn()
          .mockResolvedValue(mockGravityResponse),
      }
    })

    it("passes correct args to Gravity", async () => {
      await runAuthenticatedQuery(mutation, context)

      expect(context.deleteCollectionLoader as jest.Mock).toHaveBeenCalledWith(
        "123-abc"
      )
    })

    it("returns success response", async () => {
      const result = await runAuthenticatedQuery(mutation, context)

      expect(result).toMatchInlineSnapshot(`
        {
          "deleteCollection": {
            "responseOrError": {
              "collection": {
                "internalID": "123-abc",
                "name": "Dining room",
              },
            },
          },
        }
      `)
    })
  })

  it("returns failure when something went wrong", async () => {
    const message = `https://stagingapi.artsy.net/api/v1/collection - {"error":"Collection Not Found"}`
    const error = new Error(message)
    const context = {
      deleteCollectionLoader: jest.fn().mockRejectedValue(error),
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result).toMatchInlineSnapshot(`
      {
        "deleteCollection": {
          "responseOrError": {
            "mutationError": {
              "message": "Collection Not Found",
            },
          },
        },
      }
    `)
  })
})
