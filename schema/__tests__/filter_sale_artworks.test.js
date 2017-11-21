import schema from "schema"
import { runAuthenticatedQuery, runQuery } from "test/utils"

describe("Filter Sale Artworks", () => {
  const FilterSaleArtworks = schema.__get__("FilterSaleArtworks")
  let gravity

  beforeEach(() => {
    gravity = sinon.stub()
    gravity.with = sinon.stub().returns(gravity)
    FilterSaleArtworks.__Rewire__("gravity", gravity)
  })

  afterEach(() => {
    FilterSaleArtworks.__ResetDependency__("gravity")
  })

  it("formats the counts and aggregations, and sorts the artists correctly", () => {
    gravity
      .withArgs("filter/sale_artworks", {
        aggregations: ["total", "medium", "followed_artists", "artist"],
      })
      .returns(
        Promise.resolve({
          aggregations: {
            followed_artists: {
              value: 2,
            },
            total: {
              value: 400,
            },
            medium: {
              prints: {
                name: "Prints",
                count: 123,
              },
              painting: {
                name: "Painting",
                count: 24,
              },
            },
            artist: {
              "andy-warhol": {
                name: "Andy Warhol",
                sortable_id: "warhol-andy",
              },
              "donald-judd": {
                name: "Donald Judd",
                sortable_id: "judd-donald",
              },
              "kara-walker": {
                name: "Kara Walker",
                sortable_id: "walker-kara",
              },
            },
          },
        })
      )

    const query = `
      {
        filter_sale_artworks(
          aggregations:[TOTAL, MEDIUM, FOLLOWED_ARTISTS, ARTIST]
        ) {
          aggregations {
            slice
            counts {
              id
              name
              sortable_id
            }
          }
          counts {
            total
            followed_artists
          }
        }
      }
    `

    return runQuery(query).then(({ filter_sale_artworks: { aggregations, counts } }) => {
      expect(counts).toEqual({ followed_artists: 2, total: 400 })
      expect(aggregations).toEqual([
        {
          counts: [
            { id: "prints", name: "Prints", sortable_id: null },
            { id: "painting", name: "Painting", sortable_id: null },
          ],
          slice: "MEDIUM",
        },
        {
          counts: [
            {
              id: "donald-judd",
              name: "Donald Judd",
              sortable_id: "judd-donald",
            },
            {
              id: "kara-walker",
              name: "Kara Walker",
              sortable_id: "walker-kara",
            },
            {
              id: "andy-warhol",
              name: "Andy Warhol",
              sortable_id: "warhol-andy",
            },
          ],
          slice: "ARTIST",
        },
      ])
    })
  })

  describe("sale_artworks_connection", () => {
    it("filters artworks based on aggregations and returns pageable collection", () => {
      gravity
        .withArgs("filter/sale_artworks", {
          aggregations: ["total", "followed_artists"],
          include_artworks_by_followed_artists: true,
          size: 20,
        })
        .returns(
          Promise.resolve({
            aggregations: {
              followed_artists: {
                value: 3,
              },
              total: {
                value: 3,
              },
            },
          })
        )

      // Paginate
      gravity
        .withArgs("filter/sale_artworks", {
          page: 1,
          size: 3,
          offset: 0,
        })
        .returns(
          Promise.resolve({
            hits: [
              {
                id: "christopher-anderson-reflection-in-window-in-altamira-caracas-venezuela",
              },
              {
                id: "eduardo-abaroa-insercion-arqueologica-285-1",
              },
              {
                id: "francis-alys-the-modern-procession",
              },
            ],
          })
        )

      const query = `
        {
          filter_sale_artworks(
            aggregations:[TOTAL, FOLLOWED_ARTISTS],
            include_artworks_by_followed_artists: true,
            size: 20
          ) {
            counts {
              total
              followed_artists
            }
            sale_artworks_connection(first: 3) {
              pageInfo {
                hasNextPage
              }
              edges {
                cursor
                node {
                  id
                }
              }
            }
          }
        }
      `

      return runAuthenticatedQuery(query).then(data => {
        const { filter_sale_artworks: { sale_artworks_connection: { pageInfo, edges } } } = data
        expect(data).toMatchSnapshot()
        expect(pageInfo.hasNextPage).toEqual(false)
        expect(edges.length).toEqual(3)
      })
    })
  })
})
