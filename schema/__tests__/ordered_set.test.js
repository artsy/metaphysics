import schema from "schema"
import { runQuery } from "test/utils"

describe("OrderedSet type", () => {
  const OrderedSet = schema.__get__("OrderedSet")

  beforeEach(() => {
    const gravity = sinon.stub()

    gravity
      // OrderedSet
      .onCall(0)
      .returns(
        Promise.resolve({
          description: "",
          id: "52dd3c2e4b8480091700027f",
          item_type: "Artwork",
          key: "artworks:featured-artworks",
          name: "Featured Artworks",
        })
      )
      // ArtworkItems
      .onCall(1)
      .returns(
        Promise.resolve([
          {
            title: "My Artwork",
          },
          {
            title: "Another Artwork",
          },
        ])
      )

    OrderedSet.__Rewire__("gravity", gravity)
  })

  afterEach(() => {
    OrderedSet.__ResetDependency__("gravity")
  })

  it("fetches set by id", () => {
    const query = `
      {
        ordered_set(id: "52dd3c2e4b8480091700027f") {
          id
          name
          key
          description
          artworks: items {
            ... on ArtworkItem {
              title
            }
          }
        }
      }
    `

    return runQuery(query).then(data => {
      expect(OrderedSet.__get__("gravity").args[0]).toEqual(["set/52dd3c2e4b8480091700027f"])
      expect(OrderedSet.__get__("gravity").args[1]).toEqual(["set/52dd3c2e4b8480091700027f/items"])

      expect(data).toEqual({
        ordered_set: {
          id: "52dd3c2e4b8480091700027f",
          name: "Featured Artworks",
          description: "",
          key: "artworks:featured-artworks",
          artworks: [
            {
              title: "My Artwork",
            },
            {
              title: "Another Artwork",
            },
          ],
        },
      })
    })
  })
})
