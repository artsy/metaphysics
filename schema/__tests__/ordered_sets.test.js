import schema from "schema"
import { runQuery } from "test/utils"

describe("OrderedSets type", () => {
  const OrderedSets = schema.__get__("OrderedSets")
  const OrderedSet = OrderedSets.__get__("OrderedSet")
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

  beforeEach(() => {
    const gravity = sinon.stub()

    gravity
      // OrderedSets
      .onCall(0)
      .returns(
        Promise.resolve([
          {
            id: "52dd3c2e4b8480091700027f",
            item_type: "Gene",
            key: "artists:featured-genes",
            name: "Featured Genes",
            description: "These Genes are featured",
          },
        ])
      )
      // GeneItems
      .onCall(1)
      .returns(
        Promise.resolve([
          {
            name: "Painting",
          },
        ])
      )

    OrderedSets.__Rewire__("gravity", gravity)
    OrderedSet.__Rewire__("gravity", gravity)
  })

  afterEach(() => {
    OrderedSets.__ResetDependency__("gravity")
    OrderedSet.__ResetDependency__("gravity")
  })

  it("fetches sets by key", () => {
    return runQuery(query).then(data => {
      expect(OrderedSets.__get__("gravity").args[0][0]).toEqual("sets")
      expect(OrderedSets.__get__("gravity").args[0][1]).toMatchObject({ key: "artists:featured-genes", public: true })
      expect(OrderedSets.__get__("gravity").args[1]).toEqual(["set/52dd3c2e4b8480091700027f/items"])

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

  it("includes pagination params", () => {
    return runQuery(query).then(() => {
      expect(OrderedSets.__get__("gravity").args[0][1]).toMatchObject({ page: 1, size: 5 })
    })
  })
})
