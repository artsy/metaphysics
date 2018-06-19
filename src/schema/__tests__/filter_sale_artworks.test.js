/* eslint-disable promise/always-return */
import { runQuery } from "test/utils"

describe("Filter Sale Artworks", () => {
  let rootValue = null
  beforeEach(() => {
    rootValue = {
      saleArtworksFilterLoader: sinon
        .stub()
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
        ),
    }
  })

  it("formats the counts and aggregations, and sorts the artists correctly", () => {
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

    return runQuery(query, rootValue).then(
      ({ filter_sale_artworks: { aggregations, counts } }) => {
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
      }
    )
  })
})
