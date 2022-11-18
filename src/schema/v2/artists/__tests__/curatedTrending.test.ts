import gql from "lib/gql"
import { runQuery } from "schema/v2/test/utils"
import { ResolverContext } from "types/graphql"

const query = gql`
  query {
    curatedTrendingArtists(first: 3) {
      edges {
        node {
          slug
          name
        }
      }
    }
  }
`

/*
 * Because there is a date-seeded shuffle involved, we must
 * lock in a specific date here for deterministic test results
 */
const timeOfQuery = new Date("2022-11-15T01:00:00Z").valueOf()
jest.spyOn(global.Date, "now").mockImplementation(() => timeOfQuery)

const mockFilterArtworksResponse = {
  hits: [],
  aggregations: {
    merchandisable_artists: {
      "id-1": { name: "Daniel Heidkamp", count: 1 },
      "id-2": { name: "Chloe Wise", count: 1 },
      "id-3": { name: "Mari Kuroda", count: 1 },
      "id-4": { name: "David Hockney", count: 1 },
      "id-5": { name: "Marc Chagall", count: 1 },
    },
  },
}

const mockArtistRecords = [
  { _id: "id-1", id: "daniel-heidkamp", name: "Daniel Heidkamp" },
  { _id: "id-2", id: "chloe-wise", name: "Chloe Wise" },
  { _id: "id-3", id: "mari-kuroda", name: "Mari Kuroda" },
  { _id: "id-4", id: "david-hockney", name: "David Hockney" },
  { _id: "id-5", id: "marc-chagall", name: "Marc Chagall" },
]

let context: Partial<ResolverContext>

beforeEach(() => {
  context = {
    filterArtworksLoader: jest.fn(() =>
      Promise.resolve(mockFilterArtworksResponse)
    ),
    artistsLoader: jest.fn(
      // mock implementation to filter over the array of artists above
      ({ ids }) => {
        const matchedRecords = mockArtistRecords.filter(({ _id }) =>
          ids.includes(_id)
        )
        const sortedRecords = ids.map((id) =>
          matchedRecords.find((a) => a._id === id)
        )
        const artistsLoaderResponse = {
          body: sortedRecords,
          headers: {},
        }

        return Promise.resolve(artistsLoaderResponse)
      }
    ),
  }
})

describe("with no timezone provided", () => {
  it("returns a sample of artists, shuffled according to UTC", async () => {
    const response = await runQuery(query, context)

    expect(response).toEqual({
      curatedTrendingArtists: {
        edges: [
          { node: { slug: "david-hockney", name: "David Hockney" } },
          { node: { slug: "chloe-wise", name: "Chloe Wise" } },
          { node: { slug: "marc-chagall", name: "Marc Chagall" } },
        ],
      },
    })
  })
})

describe("with a user timezone provided", () => {
  it("returns a sample of artists, shuffled for that timezone", async () => {
    context.defaultTimezone = "America/New_York"

    const response = await runQuery(query, context)

    expect(response).toEqual({
      curatedTrendingArtists: {
        edges: [
          { node: { slug: "chloe-wise", name: "Chloe Wise" } },
          { node: { slug: "david-hockney", name: "David Hockney" } },
          { node: { slug: "marc-chagall", name: "Marc Chagall" } },
        ],
      },
    })
  })
})
