import { HTTPError } from "lib/HTTPError"
import { runAuthenticatedQuery } from "schema/v2/test/utils"
import { ResolverContext } from "types/graphql"

const mutation = `
  mutation {
    deleteBrandKit(input: { id: "brand-kit-1" }) {
      brandKitOrError {
        ... on DeleteBrandKitSuccess {
          success
        }

        ... on DeleteBrandKitFailure {
          mutationError {
            message
          }
        }
      }
    }
  }
`

describe("deleteBrandKit", () => {
  describe("valid query", () => {
    let context: Partial<ResolverContext>

    beforeEach(() => {
      context = {
        deleteBrandKitLoader: jest
          .fn()
          .mockResolvedValue({ id: "brand-kit-1" }),
      }
    })

    it("calls loader with id", async () => {
      await runAuthenticatedQuery(mutation, context)

      expect(context.deleteBrandKitLoader as jest.Mock).toHaveBeenCalledWith(
        "brand-kit-1"
      )
    })

    it("returns success: true on success", async () => {
      const result = await runAuthenticatedQuery(mutation, context)

      expect(result).toMatchInlineSnapshot(`
        {
          "deleteBrandKit": {
            "brandKitOrError": {
              "success": true,
            },
          },
        }
      `)
    })
  })

  it("returns failure on Gravity error", async () => {
    const gravityResponseBody = {
      type: "param_error",
      message: "Forbidden",
      detail: {},
    }
    const error = new HTTPError(
      "http://artsy.net - {}",
      403,
      gravityResponseBody
    )
    const context = {
      deleteBrandKitLoader: jest.fn().mockRejectedValue(error),
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result).toMatchInlineSnapshot(`
      {
        "deleteBrandKit": {
          "brandKitOrError": {
            "mutationError": {
              "message": "Forbidden",
            },
          },
        },
      }
    `)
  })
})
