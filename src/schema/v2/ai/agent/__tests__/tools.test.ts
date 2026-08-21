import { schema } from "schema/v2"
import { ResolverContext } from "types/graphql"
import { buildAgentTools, runQueryArtsyTool, summarizeToolCall } from "../tools"

describe("buildAgentTools", () => {
  it("exposes exactly one tool, query_artsy", () => {
    const tools = buildAgentTools(schema, {} as ResolverContext)
    expect(Object.keys(tools)).toEqual(["query_artsy"])
  })

  it("documents the allowed root fields and how to discover the rest via introspection", () => {
    const tools = buildAgentTools(schema, {} as ResolverContext)
    expect(tools.query_artsy.description).toContain("artworksConnection")
    expect(tools.query_artsy.description).toContain("introspection")
  })
})

describe("runQueryArtsyTool", () => {
  it("runs a realistic query against the real (narrowed) schema", async () => {
    const artistLoader = jest.fn().mockResolvedValue({
      _id: "4d8b92b34eb68a1b2c000452",
      id: "andy-warhol",
      name: "Andy Warhol",
      nationality: "American",
    })
    const context = ({ artistLoader } as unknown) as ResolverContext

    const result = await runQueryArtsyTool(
      {
        query: `
          query {
            artist(id: "andy-warhol") {
              internalID
              slug
              name
              nationality
            }
          }
        `,
      },
      schema,
      context
    )

    expect(result.ok).toBe(true)
    const data = JSON.parse(result.content)
    expect(data.artist).toMatchObject({ name: "Andy Warhol" })
  })

  it("passes variables through to the query", async () => {
    const artistLoader = jest.fn().mockResolvedValue({
      _id: "4d8b92b34eb68a1b2c000452",
      id: "andy-warhol",
      name: "Andy Warhol",
    })
    const context = ({ artistLoader } as unknown) as ResolverContext

    await runQueryArtsyTool(
      {
        query: `query($id: String!) { artist(id: $id) { name } }`,
        variables: { id: "andy-warhol" },
      },
      schema,
      context
    )

    expect(artistLoader).toHaveBeenCalledWith("andy-warhol")
  })

  it("rejects a query with invalid GraphQL syntax without throwing", async () => {
    const result = await runQueryArtsyTool(
      { query: "{ artist(id: " },
      schema,
      {} as ResolverContext
    )

    expect(result.ok).toBe(false)
    expect(result.content.length).toBeGreaterThan(0)
  })

  it("rejects a query missing entirely", async () => {
    const result = await runQueryArtsyTool({}, schema, {} as ResolverContext)

    expect(result.ok).toBe(false)
    expect(result.content).toMatch(/query/i)
  })

  it("reaches fields beyond the old fixed documents' selection, trusting resolver-level auth", async () => {
    // Field-level access control is Metaphysics' resolvers' job (an
    // unauthorized/unauthenticated caller gets null, not a leak) -- this
    // tool only gates *root* fields, not which fields within them. Picked
    // deliberately as a field the old six-tool design never selected:
    // `AttributionClass` resolves synchronously from a static map, so this
    // doesn't need any extra loader wiring to prove the point.
    const artworkLoader = jest.fn().mockResolvedValue({
      _id: "5d3d7e6a1b8e4a0f2c1a2b3c",
      id: "some-artwork",
      attribution_class: "unique",
    })
    const context = ({ artworkLoader } as unknown) as ResolverContext

    const result = await runQueryArtsyTool(
      { query: '{ artwork(id: "some-artwork") { attributionClass { name } } }' },
      schema,
      context
    )

    expect(result.ok).toBe(true)
    const data = JSON.parse(result.content)
    expect(data.artwork.attributionClass).toMatchObject({ name: "Unique" })
  })

  it("rejects a disallowed root field (e.g. me)", async () => {
    const result = await runQueryArtsyTool(
      { query: "{ me { name } }" },
      schema,
      {} as ResolverContext
    )

    expect(result.ok).toBe(false)
  })

  it("rejects a query that exceeds the depth limit", async () => {
    // Artist -> artworksConnection -> node -> artist -> artworksConnection
    // -> node -> artist -> ... nested well past MAX_QUERY_DEPTH.
    const deepArtist = (remaining: number): string =>
      remaining <= 0
        ? "internalID"
        : `artworksConnection(first: 1) { edges { node { artist { ${deepArtist(
            remaining - 1
          )} } } } }`

    const result = await runQueryArtsyTool(
      { query: `{ artist(id: "andy-warhol") { ${deepArtist(10)} } }` },
      schema,
      {} as ResolverContext
    )

    expect(result.ok).toBe(false)
    expect(result.content).toMatch(/depth/i)
  })

  it("rejects a page-size argument over the max, whether literal or via variables", async () => {
    const literal = await runQueryArtsyTool(
      { query: '{ artistsConnection(term: "warhol", first: 500) { totalCount } }' },
      schema,
      {} as ResolverContext
    )
    expect(literal.ok).toBe(false)
    expect(literal.content).toMatch(/page size/i)

    const viaVariable = await runQueryArtsyTool(
      {
        query:
          "query($first: Int!) { artistsConnection(term: \"warhol\", first: $first) { totalCount } }",
        variables: { first: 500 },
      },
      schema,
      {} as ResolverContext
    )
    expect(viaVariable.ok).toBe(false)
    expect(viaVariable.content).toMatch(/page size/i)
  })

  it("returns ok:false with a readable message on a GraphQL execution error, without throwing", async () => {
    const artistLoader = jest.fn().mockRejectedValue(new Error("boom"))
    const context = ({ artistLoader } as unknown) as ResolverContext

    const result = await runQueryArtsyTool(
      { query: '{ artist(id: "andy-warhol") { name } }' },
      schema,
      context
    )

    expect(result.ok).toBe(false)
    expect(typeof result.content).toBe("string")
    expect(result.content.length).toBeGreaterThan(0)
  })
})

describe("summarizeToolCall", () => {
  it("extracts the root field being queried", () => {
    expect(
      summarizeToolCall({ query: '{ artist(id: "andy-warhol") { name } }' })
    ).toBe("Querying Artsy: artist…")
  })

  it("falls back to a generic label when the root field can't be identified", () => {
    expect(summarizeToolCall({ query: "not graphql" })).toBe("Querying Artsy…")
    expect(summarizeToolCall({})).toBe("Querying Artsy…")
  })
})
