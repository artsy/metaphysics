/* eslint-disable promise/always-return */
import { runAuthenticatedQuery } from "test/utils"
import gql from "lib/gql"

describe("CreateGeminiEntryForAsset", () => {
  it("creates a submission and returns its new data payload", () => {
    const mutation = gql`
      mutation {
        createGeminiEntryForAsset(
          input: {
            template_key: "convection-staging"
            source_key: "2OSuAo_FAxJGHgGy0H2f-g/Orta2 2.jpg"
            source_bucket: "artsy-media-uploads"
            metadata: { id: 144, _type: "Consignment" }
          }
        ) {
          asset {
            token
          }
        }
      }
    `

    const rootValue = {
      createNewGeminiEntryAssetLoader: () =>
        Promise.resolve({
          token: "zVHJce-Fey3OIsazH8WDTg",
          image_urls: {},
          clientMutationId: "1231",
        }),
    }

    expect.assertions(1)
    return runAuthenticatedQuery(mutation, rootValue).then(data => {
      expect(data).toMatchSnapshot()
    })
  })
})
