/* eslint-disable promise/always-return */
import { runQuery } from "test/utils"

describe("OrderedSets type", () => {
  const query = `
  {
    ordered_sets(key: "artists:featured-genes", page: 1, size: 5) {
      id
      name
      description
      genes: items {
        ... on GeneItem {
          name
        }
      }
    }
  }
`

  const rootValue = {
    setsLoader: sinon.stub().returns(
      Promise.resolve([
        {
          id: "52dd3c2e4b8480091700027f",
          item_type: "Gene",
          key: "artists:featured-genes",
          name: "Featured Genes",
          description: "These Genes are featured",
        },
      ])
    ),
    setItemsLoader: sinon.stub().returns(
      Promise.resolve([
        {
          name: "Painting",
        },
      ])
    ),
  }

  it("fetches sets by key", () => {
    return runQuery(query, rootValue).then(data => {
      expect(data).toEqual({
        ordered_sets: [
          {
            id: "52dd3c2e4b8480091700027f",
            name: "Featured Genes",
            description: "These Genes are featured",
            genes: [
              {
                name: "Painting",
              },
            ],
          },
        ],
      })
    })
  })
})
