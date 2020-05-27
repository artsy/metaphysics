import _ from "lodash"
import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("Sale Artworks", () => {
  const execute = async (gravityResponse, query, context = {}) => {
    return await runAuthenticatedQuery(query, {
      saleArtworksFilterLoader: () => Promise.resolve(gravityResponse),
      ...context,
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
        me {
          lotsByFollowedArtistsConnection(liveSale: true, isAuction: true) {
            counts {
              total
            }
            edges {
              node {
                slug
              }
            }
          }
        }
      }
    `

    const {
      me: {
        lotsByFollowedArtistsConnection: {
          counts: { total },
          edges,
        },
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
        me {
          lotsByFollowedArtistsConnection {
            counts {
              total
            }
            edges {
              node {
                slug
              }
            }
          }
        }
      }
    `
    const {
      me: {
        lotsByFollowedArtistsConnection: {
          counts: { total },
          edges,
        },
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
        me {
          lotsByFollowedArtistsConnection(first: 1) {
            edges {
              node {
                slug
              }
            }
          }
        }
      }
    `
    const {
      me: {
        lotsByFollowedArtistsConnection: { edges },
      },
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
        me {
          lotsByFollowedArtistsConnection(first: 5) {
            pageInfo {
              startCursor
              endCursor
              hasNextPage
            }
            edges {
              cursor
              node {
                slug
              }
            }
          }
        }
      }
    `
    const {
      me: {
        lotsByFollowedArtistsConnection: {
          edges,
          pageInfo: { startCursor, endCursor, hasNextPage },
        },
      },
    } = await execute(gravityResponse, query)
    const [first, last] = [_.first(edges), _.last(edges)]
    expect(first.cursor).toEqual(startCursor)
    expect(last.cursor).toEqual(endCursor)
    expect(hasNextPage).toEqual(true)

    query = gql`
      {
        me {
          lotsByFollowedArtistsConnection(first: 15, after: "${last.cursor}") {
            pageInfo {
              hasNextPage
            }
          }
        }
      }
    `
    const {
      me: {
        lotsByFollowedArtistsConnection: { pageInfo },
      },
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
        me {
          lotsByFollowedArtistsConnection {
            counts {
              total
            }
          }
        }
      }
    `
    const {
      me: {
        lotsByFollowedArtistsConnection: {
          counts: { total },
        },
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
        me {
          lotsByFollowedArtistsConnection(
            aggregations: [TOTAL, MEDIUM, FOLLOWED_ARTISTS]
          ) {
            aggregations {
              counts {
                value
              }
            }
          }
        }
      }
    `
    const {
      me: {
        lotsByFollowedArtistsConnection: { aggregations },
      },
    } = await execute(gravityResponse, query)

    expect(aggregations.length).toBeGreaterThan(0)
    aggregations.forEach((aggregation) => {
      expect(aggregation.counts.length).toBeGreaterThan(0)
    })
  })
})
