/* eslint-disable promise/always-return */
import { runAuthenticatedQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

// FIXME: We're now stitching. Remove these files once this work settles
xdescribe("CreateGeminiEntryForAsset", () => {
  it("creates a submission and returns its new data payload", () => {
    const mutation = gql`
      mutation {
        createGeminiEntryForAsset(
          input: {
            templateKey: "convection-staging"
            sourceKey: "2OSuAo_FAxJGHgGy0H2f-g/Orta2 2.jpg"
            sourceBucket: "artsy-media-uploads"
            metadata: { id: 144, _type: "Consignment" }
          }
        ) {
          asset {
            token
          }
        }
      }
    `

    const context = {
      createNewGeminiEntryAssetLoader: () => () =>
        Promise.resolve({
          token: "zVHJce-Fey3OIsazH8WDTg",
          image_urls: {},
          clientMutationId: "1231",
        }),
    }

    expect.assertions(1)
    return runAuthenticatedQuery(mutation, context).then((data) => {
      expect(data).toMatchSnapshot()
    })
  })
})
