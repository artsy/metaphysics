import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

const mutation = gql`
  mutation {
    deleteFeature(input: { id: "abc123" }) {
      featureOrError {
        __typename
        ... on DeleteFeatureSuccess {
          feature {
            name
            isActive
          }
        }
        ... on DeleteFeatureFailure {
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

describe("deleteFeatureMutation", () => {
  describe("on success", () => {
    const feature = {
      name: "Catty Feature",
      id: "abc123",
      active: true,
    }

    const mockDeleteFeatureLoader = jest.fn()

    const context = {
      deleteFeatureLoader: mockDeleteFeatureLoader,
    }

    beforeEach(() => {
      mockDeleteFeatureLoader.mockResolvedValue(Promise.resolve(feature))
    })

    afterEach(() => {
      mockDeleteFeatureLoader.mockReset()
    })

    it("returns the deleted feature", async () => {
      const res = await runAuthenticatedQuery(mutation, context)

      expect(mockDeleteFeatureLoader).toBeCalledWith("abc123")

      expect(res).toEqual({
        deleteFeature: {
          featureOrError: {
            __typename: "DeleteFeatureSuccess",
            feature: {
              name: "Catty Feature",
              isActive: true,
            },
          },
        },
      })
    })
  })

  describe("on failure", () => {
    const context = {
      deleteFeatureLoader: () =>
        Promise.reject(
          new Error(
            `https://stagingapi.artsy.net/api/v1/feature - {"type": "error","message":"example message","detail":"example detail"}`
          )
        ),
    }

    it("returns a mutation error", async () => {
      const res = await runAuthenticatedQuery(mutation, context)

      expect(res).toEqual({
        deleteFeature: {
          featureOrError: {
            __typename: "DeleteFeatureFailure",
            mutationError: {
              type: "error",
              message: "example message",
              detail: "example detail",
            },
          },
        },
      })
    })
  })
})
