import { base64 } from "lib/base64"
import { fetchHybridConnection } from "./fetchHybridConnection"

describe("fetchHybridConnection()", () => {
  const sourceAFetcher = jest.fn()
  const sourceBFetcher = jest.fn()

  beforeEach(() => {
    jest.resetAllMocks()
    sourceAFetcher.mockResolvedValue({
      totalCount: 5,
      nodes: [
        { id: "a-1", createdAt: 1 },
        { id: "a-2", createdAt: 3 },
        { id: "a-3", createdAt: 5 },
      ],
    })
    sourceBFetcher.mockResolvedValue({
      totalCount: 10,
      nodes: [
        { id: "b-1", createdAt: 2 },
        { id: "b-2", createdAt: 4 },
        { id: "b-3", createdAt: 6 },
      ],
    })
  })

  it("fetches from each collection from the beginning", async () => {
    const { edges, pageInfo } = await fetchHybridConnection({
      args: { first: 3, sort: "DESC" },
      fetchers: {
        a: sourceAFetcher,
        b: sourceBFetcher,
      },
      transform: (args, nodes: any[]) => {
        const sorter =
          args.sort === "DESC"
            ? (a, b) => b.createdAt - a.createdAt
            : (a, b) => a.createdAt - b.createdAt
        return nodes.sort(sorter)
      },
    })

    expect(edges.map(({ node }) => node.id)).toEqual(["b-3", "a-3", "b-2"])
    expect(pageInfo.hasNextPage).toBeTrue()
    expect(pageInfo.hasPreviousPage).toBeFalse()
  })

  it("understands when you are on the last page", async () => {
    sourceAFetcher.mockResolvedValue({
      totalCount: 3,
      nodes: [
        { id: "a-1", createdAt: 1 },
        { id: "a-2", createdAt: 3 },
        { id: "a-3", createdAt: 5 },
      ],
    })
    sourceBFetcher.mockResolvedValue({
      totalCount: 3,
      nodes: [
        { id: "b-1", createdAt: 2 },
        { id: "b-2", createdAt: 4 },
        { id: "b-3", createdAt: 6 },
      ],
    })

    const { edges, pageInfo } = await fetchHybridConnection({
      args: { first: 20, sort: "DESC" },
      fetchers: {
        a: sourceAFetcher,
        b: sourceBFetcher,
      },
    })
    expect(edges.length).toEqual(6)
    expect(pageInfo.hasNextPage).toBeFalse()
  })

  it("calls the provided fetchers with expected offset and size args", async () => {
    const cursor = base64("offsets:_position=2&a=1&b=2")
    await fetchHybridConnection({
      args: { first: 5, after: cursor, sort: "DESC" },
      fetchers: {
        a: sourceAFetcher,
        b: sourceBFetcher,
      },
    })
    expect(sourceAFetcher).toHaveBeenCalledWith({
      limit: 5,
      offset: 1,
      sort: "DESC",
    })
    expect(sourceBFetcher).toHaveBeenCalledWith({
      limit: 5,
      offset: 2,
      sort: "DESC",
    })
  })
})
