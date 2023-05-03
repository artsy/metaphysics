/* eslint-disable promise/always-return */
import { runQuery } from "schema/v2/test/utils"

describe("OrderedSets type", () => {
  const query = `
  {
    orderedSets(key: "artists:featured-genes") {
      internalID
      name
      description
      genes: items {
        ... on Gene {
          name
        }
      }
    }
  }
`

  const context = {
    setsLoader: sinon.stub().returns(
      Promise.resolve({
        body: [
          {
            id: "52dd3c2e4b8480091700027f",
            item_type: "Gene",
            key: "artists:featured-genes",
            name: "Featured Genes",
            description: "These Genes are featured",
          },
        ],
      })
    ),
    setItemsLoader: sinon.stub().returns(
      Promise.resolve({
        body: [
          {
            name: "Painting",
          },
        ],
        headers: { "x-total-count": 1 },
      })
    ),
  }

  it("fetches sets by key", () => {
    return runQuery(query, context).then((data) => {
      expect(data).toEqual({
        orderedSets: [
          {
            internalID: "52dd3c2e4b8480091700027f",
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
