import _ from "lodash"
import gql from "lib/gql"
import { runQuery } from "test/utils"

describe("Sale Artworks", () => {
  const execute = async (gravityResponse, query, rootValue = {}) => {
    return await runQuery(query, {
      saleArtworksFilterLoader: () => Promise.resolve(gravityResponse),
      ...rootValue,
    })
  }

  it("pulls from /sale_artworks if `live_sale, include_lots_by_followed_artists, is_auction to true` ", async () => {
    const hits = _.fill(Array(10), { id: "foo" })
    const totalCount = hits.length * 2
    const gravityResponse = {
      body: hits,
      headers: {
        "x-total-count": totalCount,
      },
    }
    const query = gql`
      {
        sale_artworks(
          live_sale: true
          include_artworks_by_followed_artists: true
          is_auction: true
        ) {
          counts {
            total
          }
          edges {
            node {
              id
            }
          }
        }
      }
    `

    const {
      sale_artworks: {
        counts: { total },
        edges,
      },
    } = await execute(gravityResponse, query, {
      saleArtworksAllLoader: () => Promise.resolve(gravityResponse),
    })
    expect(total).toEqual(totalCount)
    expect(edges.length).toEqual(hits.length)
  })

  it("returns 10 items by default", async () => {
    const hits = _.fill(Array(10), { id: "foo" })
    const totalCount = hits.length * 2
    const gravityResponse = {
      hits,
      aggregations: {
        total: {
          value: totalCount,
        },
      },
    }
    const query = gql`
      {
        sale_artworks {
          counts {
            total
          }
          edges {
            node {
              id
            }
          }
        }
      }
    `
    const {
      sale_artworks: {
        counts: { total },
        edges,
      },
    } = await execute(gravityResponse, query)
    expect(total).toEqual(totalCount)
    expect(edges.length).toEqual(hits.length)
  })

  it("allows for adjustable size counts", async () => {
    const size = 1
    const hits = _.fill(Array(size), { id: "foo" })
    const gravityResponse = {
      hits,
      aggregations: {
        total: {
          value: hits.length,
        },
      },
    }
    const query = gql`
      {
        sale_artworks(size: 1) {
          edges {
            node {
              id
            }
          }
        }
      }
    `
    const {
      sale_artworks: { edges },
    } = await execute(gravityResponse, query)
    expect(edges.length).toEqual(size)
  })

  it("allows for cursor offsets", async () => {
    const hits = _.fill(Array(20), { id: "foo" })
    const gravityResponse = {
      hits,
      aggregations: {
        total: {
          value: hits.length,
        },
      },
    }
    let query = gql`
      {
        sale_artworks(first: 5) {
          pageInfo {
            startCursor
            endCursor
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
    `
    const {
      sale_artworks: {
        edges,
        pageInfo: { startCursor, endCursor, hasNextPage },
      },
    } = await execute(gravityResponse, query)
    const [first, last] = [_.first(edges), _.last(edges)]
    expect(first.cursor).toEqual(startCursor)
    expect(last.cursor).toEqual(endCursor)
    expect(hasNextPage).toEqual(true)

    query = gql`
      {
        sale_artworks(first: 15, after: "${last.cursor}") {
          pageInfo {
            hasNextPage
          }
        }
      }
    `
    const {
      sale_artworks: { pageInfo },
    } = await execute(gravityResponse, query)
    expect(pageInfo.hasNextPage).toEqual(false)
  })

  it("#counts", async () => {
    const hits = Array(10)
    const gravityResponse = {
      hits,
      aggregations: {
        total: {
          value: hits.length,
        },
      },
    }
    const query = gql`
      {
        sale_artworks {
          counts {
            total
          }
        }
      }
    `
    const {
      sale_artworks: {
        counts: { total },
      },
    } = await execute(gravityResponse, query)
    expect(total).toEqual(hits.length)
  })

  it("#aggregations", async () => {
    const hits = Array(10)
    const gravityResponse = {
      hits,
      aggregations: {
        followed_artists: {
          value: 2,
        },
        total: {
          value: 2,
        },
        medium: {
          prints: {
            name: "Prints",
            count: 2,
          },
          painting: {
            name: "Painting",
            count: 2,
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
    }

    const query = gql`
      {
        sale_artworks(aggregations: [TOTAL, MEDIUM, FOLLOWED_ARTISTS]) {
          aggregations {
            counts {
              id
            }
          }
        }
      }
    `
    const {
      sale_artworks: { aggregations },
    } = await execute(gravityResponse, query)

    expect(aggregations.length).toBeGreaterThan(0)
    aggregations.forEach(aggregation => {
      expect(aggregation.counts.length).toBeGreaterThan(0)
    })
  })
})
