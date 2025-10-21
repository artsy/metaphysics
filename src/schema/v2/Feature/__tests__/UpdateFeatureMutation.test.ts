import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

const mutation = gql`
  mutation {
    updateFeature(
      input: {
        sourceBucket: "catty-bucket"
        sourceKey: "catty-key"
        name: "Catty Feature"
        id: "xyz789"
        videoURL: "https://somevideo.url"
        active: true
      }
    ) {
      featureOrError {
        __typename
        ... on UpdateFeatureSuccess {
          feature {
            name
            isActive
            videoURL
          }
        }
        ... on UpdateFeatureFailure {
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

describe("UpdateFeatureMutation", () => {
  describe("on success", () => {
    const feature = {
      id: "xyz789",
      name: "Catty Feature",
      active: true,
      video_url: "https://somevideo.url",
      source_bucket: "catty-bucket",
      source_key: "catty-key",
    }

    const mockUpdateFeatureLoader = jest.fn()

    const context = {
      updateFeatureLoader: mockUpdateFeatureLoader,
    }

    beforeEach(() => {
      mockUpdateFeatureLoader.mockResolvedValue(Promise.resolve(feature))
    })

    afterEach(() => {
      mockUpdateFeatureLoader.mockReset()
    })

    it("returns the updated feature", async () => {
      const res = await runAuthenticatedQuery(mutation, context)

      expect(mockUpdateFeatureLoader).toBeCalledWith("xyz789", {
        name: "Catty Feature",
        active: true,
        source_bucket: "catty-bucket",
        source_key: "catty-key",
        video_url: "https://somevideo.url",
      })

      expect(res).toEqual({
        updateFeature: {
          featureOrError: {
            __typename: "UpdateFeatureSuccess",
            feature: {
              name: "Catty Feature",
              videoURL: "https://somevideo.url",
              isActive: true,
            },
          },
        },
      })
    })
  })

  describe("on failure", () => {
    const context = {
      updateFeatureLoader: () =>
        Promise.reject(
          new Error(
            `https://stagingapi.artsy.net/api/v1/feature - {"type": "error","message":"example message","detail":"example detail"}`
          )
        ),
    }

    it("returns a mutation error", async () => {
      const res = await runAuthenticatedQuery(mutation, context)

      expect(res).toEqual({
        updateFeature: {
          featureOrError: {
            __typename: "UpdateFeatureFailure",
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
