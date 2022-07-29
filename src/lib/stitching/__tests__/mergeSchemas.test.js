import { runQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

describe("stitched schema regressions", () => {
  it("union in interface fragment issue", async () => {
    const artworkResponse = {
      _id: "banksy-di-faced-tenner-21",
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

    const result = await runQuery(
      gql`
        {
          artwork(id: "banksy-di-faced-tenner-21") {
            internalID
            context {
              ... on Node {
                id
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
        internalID: "banksy-di-faced-tenner-21",
        context: {
          id: "U2FsZToxMjM=",
          __typename: "Sale",
        },
      },
    })
  })

  it("handles dual root elements issue", async () => {
    const result = await runQuery(
      gql`
        {
          artwork(id: "banksy-di-faced-tenner-21") {
            internalID
          }
          artist(id: "banksy") {
            internalID
          }
        }
      `,
      {
        artworkLoader: async () => ({ _id: "banksy-di-faced-tenner-21" }),
        artistLoader: async () => ({ _id: "banksy" }),
      }
    )
    expect(result).toEqual({
      artwork: {
        internalID: "banksy-di-faced-tenner-21",
      },
      artist: {
        internalID: "banksy",
      },
    })
  })
})
