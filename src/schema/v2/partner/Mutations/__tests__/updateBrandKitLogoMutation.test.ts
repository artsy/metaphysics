import { HTTPError } from "lib/HTTPError"
import { runAuthenticatedQuery } from "schema/v2/test/utils"
import { ResolverContext } from "types/graphql"

const mutation = `
  mutation {
    updateBrandKitLogo(input: {
      id: "brand-kit-1"
      remoteImageS3Key: "uploads/logo.png"
      remoteImageS3Bucket: "artsy-uploads"
    }) {
      brandKitOrError {
        ... on UpdateBrandKitLogoSuccess {
          brandKit {
            internalID
          }
        }

        ... on UpdateBrandKitLogoFailure {
          mutationError {
            message
          }
        }
      }
    }
  }
`

describe("updateBrandKitLogo", () => {
  describe("valid query", () => {
    const mockGravityResponse = {
      id: "brand-kit-1",
      partner_id: "partner-1",
      image: {
        id: "ar-image-1",
      },
    }

    let context: Partial<ResolverContext>

    beforeEach(() => {
      context = {
        uploadBrandKitLogoLoader: jest
          .fn()
          .mockResolvedValue(mockGravityResponse),
      }
    })

    it("calls loader with id and snake_cased S3 params", async () => {
      await runAuthenticatedQuery(mutation, context)

      expect(
        context.uploadBrandKitLogoLoader as jest.Mock
      ).toHaveBeenCalledWith("brand-kit-1", {
        remote_image_s3_key: "uploads/logo.png",
        remote_image_s3_bucket: "artsy-uploads",
      })
    })

    it("returns the brand kit", async () => {
      const result = await runAuthenticatedQuery(mutation, context)

      expect(result).toMatchInlineSnapshot(`
        {
          "updateBrandKitLogo": {
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
      message: "Something went wrong.",
      detail: {},
    }
    const error = new HTTPError(
      "http://artsy.net - {}",
      400,
      gravityResponseBody
    )
    const context = {
      uploadBrandKitLogoLoader: jest.fn().mockRejectedValue(error),
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result).toMatchInlineSnapshot(`
      {
        "updateBrandKitLogo": {
          "brandKitOrError": {
            "mutationError": {
              "message": "Something went wrong.",
            },
          },
        },
      }
    `)
  })
})
