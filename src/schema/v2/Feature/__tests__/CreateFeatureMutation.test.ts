import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

const mutation = gql`
  mutation {
    createFeature(
      input: {
        sourceBucket: "catty-bucket"
        sourceKey: "catty-key"
        name: "Catty Feature"
        active: true
      }
    ) {
      featureOrError {
        __typename
        ... on CreateFeatureSuccess {
          feature {
            name
            isActive
          }
        }
        ... on CreateFeatureFailure {
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

describe("CreateFeatureMutation", () => {
  describe("on success", () => {
    const set = {
      name: "Catty Feature",
      active: true,
      id: "feature-id",
      source_bucket: "catty-bucket",
      source_key: "catty-key",
    }

    const mockCreateFeatureLoader = jest.fn()

    const context = {
      createFeatureLoader: mockCreateFeatureLoader,
    }

    beforeEach(() => {
      mockCreateFeatureLoader.mockResolvedValue(Promise.resolve(set))
    })

    afterEach(() => {
      mockCreateFeatureLoader.mockReset()
    })

    it("returns a feature", async () => {
      const res = await runAuthenticatedQuery(mutation, context)

      expect(mockCreateFeatureLoader).toBeCalledWith({
        name: "Catty Feature",
        active: true,
        source_bucket: "catty-bucket",
        source_key: "catty-key",
      })

      expect(res).toEqual({
        createFeature: {
          featureOrError: {
            __typename: "CreateFeatureSuccess",
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
      createFeatureLoader: () =>
        Promise.reject(
          new Error(
            `https://stagingapi.artsy.net/api/v1/feature - {"type": "error","message":"example message","detail":"example detail"}`
          )
        ),
    }

    it("returns a mutation error", async () => {
      const res = await runAuthenticatedQuery(mutation, context)

      expect(res).toEqual({
        createFeature: {
          featureOrError: {
            __typename: "CreateFeatureFailure",
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
