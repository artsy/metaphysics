import _ from "lodash"
import schema from "schema"
import { runQuery } from "test/utils"

describe("Sale Artworks", () => {
  const FilterSaleArtworks = schema.__get__("SaleArtworks")
  let gravity

  beforeEach(() => {
    gravity = sinon.stub()
    gravity.with = sinon.stub().returns(gravity)
    FilterSaleArtworks.__Rewire__("gravity", gravity)
  })

  afterEach(() => {
    FilterSaleArtworks.__ResetDependency__("gravity")
  })

  // Test helper
  const execute = async (gravityResponse, query, args = {}) => {
    const DEFAULTS = { aggregations: ["total"], page: 1, size: 10, offset: 0 }
    gravity.withArgs("filter/sale_artworks", { ...DEFAULTS, ...args }).returns(Promise.resolve(gravityResponse))
    const data = await runQuery(query)
    return data
  }

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
    const query = `{
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
    }`

    const { sale_artworks: { counts: { total }, edges } } = await execute(gravityResponse, query)
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
    const query = `{
      sale_artworks(
        size: 1
      ) {
        edges {
          node {
            id
          }
        }
      }
    }`

    const { sale_artworks: { edges } } = await execute(gravityResponse, query, { size })
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
    const query = `{
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
    }`

    const { sale_artworks: { edges, pageInfo: { startCursor, endCursor, hasNextPage } } } = await execute(
      gravityResponse,
      query
    )
    const [first, last] = [_.first(edges), _.last(edges)]
    expect(first.cursor).toEqual(startCursor)
    expect(last.cursor).toEqual(endCursor)
    expect(hasNextPage).toEqual(true)

    const query2 = `{
      sale_artworks(after: "${last.cursor}") {
        pageInfo {
          hasNextPage
        }
      }
    }`
    const { sale_artworks: { pageInfo } } = await execute(gravityResponse, query2)
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
    const query = `{
      sale_artworks {
        counts {
          total
        }
      }
    }`

    const { sale_artworks: { counts: { total } } } = await execute(gravityResponse, query)
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

    const query = `{
      sale_artworks(aggregations:[TOTAL, MEDIUM, FOLLOWED_ARTISTS]) {
        aggregations {
          counts {
            id
          }
        }
      }
    }`

    const { sale_artworks: { aggregations } } = await execute(gravityResponse, query, {
      aggregations: ["total", "medium", "followed_artists"],
    })

    expect(aggregations.length).toBeGreaterThan(0)

    aggregations.forEach(aggregation => {
      expect(aggregation.counts.length).toBeGreaterThan(0)
    })
  })
})
