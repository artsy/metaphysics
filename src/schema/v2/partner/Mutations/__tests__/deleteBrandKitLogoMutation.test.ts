import { HTTPError } from "lib/HTTPError"
import { runAuthenticatedQuery } from "schema/v2/test/utils"
import { ResolverContext } from "types/graphql"

const mutation = `
  mutation {
    deleteBrandKitLogo(input: { id: "brand-kit-1" }) {
      brandKitOrError {
        ... on DeleteBrandKitLogoSuccess {
          brandKit {
            internalID
          }
        }

        ... on DeleteBrandKitLogoFailure {
          mutationError {
            message
          }
        }
      }
    }
  }
`

describe("deleteBrandKitLogo", () => {
  describe("valid query", () => {
    const mockGravityResponse = {
      id: "brand-kit-1",
      partner_id: "partner-1",
    }

    let context: Partial<ResolverContext>

    beforeEach(() => {
      context = {
        deleteBrandKitLogoLoader: jest
          .fn()
          .mockResolvedValue(mockGravityResponse),
      }
    })

    it("calls loader with id", async () => {
      await runAuthenticatedQuery(mutation, context)

      expect(
        context.deleteBrandKitLogoLoader as jest.Mock
      ).toHaveBeenCalledWith("brand-kit-1")
    })

    it("returns the brand kit", async () => {
      const result = await runAuthenticatedQuery(mutation, context)

      expect(result).toMatchInlineSnapshot(`
        {
          "deleteBrandKitLogo": {
            "brandKitOrError": {
              "brandKit": {
                "internalID": "brand-kit-1",
              },
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
      deleteBrandKitLogoLoader: jest.fn().mockRejectedValue(error),
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result).toMatchInlineSnapshot(`
      {
        "deleteBrandKitLogo": {
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
