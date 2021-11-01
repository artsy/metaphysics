import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("Delete Collector Profile Icon mutation", () => {
  const icon = {
    id: "555",
    url: "https://image.url.com/key",
    image_url: "https://image.url.com/key",
    versions: ["thumbnail", "medium_square"],
    image_versions: [],
  }

  const mutation = `
  mutation {
    deleteMyUserProfileIcon(input: {}) {
      iconOrError {
        ... on UserIconDeleteSuccessType {
          icon {
            internalID
          }
        }
        ... on UserIconDeleteFailureType {
          mutationError {
            type
            message
            detail
          }
        }
      }
    }
  }
  `

  const context = {
    deleteCollectorProfileIconLoader: () => Promise.resolve(icon),
  }

  it("deletes icon successfully", async () => {
    const data = await runAuthenticatedQuery(mutation, context)
    expect(data).toEqual({
      deleteMyUserProfileIcon: {
        iconOrError: { icon: { internalID: "555" } },
      },
    })
  })

  it("deletes icon with an error message", async () => {
    const errorRootValue = {
      deleteCollectorProfileIconLoader: () =>
        Promise.reject(
          new Error(
            `https://stagingapi.artsy.net/api/v1/me/collector_profile/icon - {"error": "No collector profile icon exists"}`
          )
        ),
    }
    const data = await runAuthenticatedQuery(mutation, errorRootValue)
    expect(data).toEqual({
      deleteMyUserProfileIcon: {
        iconOrError: {
          mutationError: {
            detail: null,
            message: "No collector profile icon exists",
            type: "error",
          },
        },
      },
    })
  })

  it("throws error if error is not recognizable", async () => {
    const errorRootValue = {
      deleteCollectorProfileIconLoader: () => {
        throw new Error("ETIMEOUT service unreachable")
      },
    }

    expect.assertions(1)

    await expect(
      runAuthenticatedQuery(mutation, errorRootValue)
    ).rejects.toThrow("ETIMEOUT service unreachable")
  })
})
