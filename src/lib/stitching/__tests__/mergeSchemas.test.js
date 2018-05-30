import { runQueryMerged } from "test/utils"
import gql from "test/gql"

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
      gql`
        {
          artwork(id: "banksy-di-faced-tenner-21") {
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
        artworkLoader: async () => {return artworkResponse},
        salesLoader: async () => {return salesResponse},
        relatedFairsLoader: async () => {return {}},
        relatedShowsLoader: async () => {return {}},
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

  it("handles dual root elements issue", async () => {
    const result = await runQueryMerged(
      gql`
        {
          artwork(id: "banksy-di-faced-tenner-21") {
            id
          }
          artist(id: "banksy") {
            id
          }
        }
      `,
      {
        artworkLoader: async () => {return { id: "banksy-di-faced-tenner-21" }},
        artistLoader: async () => {return { id: "banksy" }},
      }
    )
    expect(result).toEqual({
      artwork: {
        id: "banksy-di-faced-tenner-21",
      },
      artist: {
        id: "banksy",
      },
    })
  })
})
