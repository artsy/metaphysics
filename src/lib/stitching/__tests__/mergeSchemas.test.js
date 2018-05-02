import { runQueryMerged } from "test/utils"

describe("stiched schema regressions", () => {
  it("union in interface fragment issue", async () => {
    const artworkResponse = {
      id: "banksy-di-faced-tenner-21",
      sale_ids: ["foo-foo"],
    }

    const salesResponse = [
      {
        id: "foo-foo",
        _id: "123",
        currency: "$",
        is_auction: true,
        increment_strategy: "default",
      },
    ]

    const result = await runQueryMerged(
      `
      {
        artwork(id:"banksy-di-faced-tenner-21") {
          id
          context {
            ... on Node {
              __id
              __typename
            }
          }
        }
      }
    `,
      {
        artworkLoader: async () => artworkResponse,
        salesLoader: async () => salesResponse,
        relatedFairsLoader: async () => ({}),
        relatedShowsLoader: async () => ({}),
      }
    )
    expect(result).toEqual({
      artwork: {
        id: "banksy-di-faced-tenner-21",
        context: {
          __id: "QXJ0d29ya0NvbnRleHRBdWN0aW9uOmZvby1mb28=",
          __typename: "ArtworkContextAuction",
        },
      },
    })
  })
})
