import { schema } from "schema/v2"
import { ResolverContext } from "types/graphql"
import {
  buildAgentTools,
  narrowSchemaFor,
  runQueryArtsyTool,
  summarizeToolCall,
} from "../tools"
import { mapSchema, MapperKind } from "@graphql-tools/utils"
import { GraphQLObjectType, parse, specifiedRules, validate } from "graphql"
import { HTTPError } from "lib/HTTPError"

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
      {
        query: '{ artwork(id: "some-artwork") { attributionClass { name } } }',
      },
      schema,
      context
    )

    expect(result.ok).toBe(true)
    const data = JSON.parse(result.content)
    expect(data.artwork.attributionClass).toMatchObject({ name: "Unique" })
  })

  it("rejects a disallowed root field (e.g. sale)", async () => {
    const result = await runQueryArtsyTool(
      { query: '{ sale(id: "some-sale") { name } }' },
      schema,
      {} as ResolverContext
    )

    expect(result.ok).toBe(false)
  })

  it("runs the trending recipe, through the depth and complexity caps", async () => {
    const trendingSearchesLoader = jest.fn().mockResolvedValue({
      data: {
        artists: [{ entity_id: "4d8b92b34eb68a1b2c000452" }],
        artworks: [
          { entity_id: "5d3d7e6a1b8e4a0f2c1a2b3c" },
          { entity_id: "5d3d7e6a1b8e4a0f2c1a2b3d" },
        ],
      },
    })
    const artworksLoader = jest.fn().mockResolvedValue([
      // Returned out of rank order, as Gravity's batch endpoint may.
      { _id: "5d3d7e6a1b8e4a0f2c1a2b3d", id: "second", title: "Second" },
      { _id: "5d3d7e6a1b8e4a0f2c1a2b3c", id: "first", title: "First" },
    ])
    const context = ({
      artworksLoader,
      unauthenticatedLoaders: { trendingSearchesLoader },
    } as unknown) as ResolverContext

    const result = await runQueryArtsyTool(
      {
        query: `
          {
            trendingSearches(period: SEVEN_DAYS) {
              label
              artworks(first: 20) {
                rank
                artwork { internalID slug title }
              }
            }
          }
        `,
      },
      schema,
      context
    )

    expect(result.ok).toBe(true)
    const { artworks } = JSON.parse(result.content).trendingSearches
    expect(artworks).toEqual([
      {
        rank: 1,
        artwork: {
          internalID: "5d3d7e6a1b8e4a0f2c1a2b3c",
          slug: "first",
          title: "First",
        },
      },
      {
        rank: 2,
        artwork: {
          internalID: "5d3d7e6a1b8e4a0f2c1a2b3d",
          slug: "second",
          title: "Second",
        },
      },
    ])
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
      {
        query:
          '{ artistsConnection(term: "warhol", first: 500) { totalCount } }',
      },
      schema,
      {} as ResolverContext
    )
    expect(literal.ok).toBe(false)
    expect(literal.content).toMatch(/page size/i)

    const viaVariable = await runQueryArtsyTool(
      {
        query:
          'query($first: Int!) { artistsConnection(term: "warhol", first: $first) { totalCount } }',
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

describe("the root field allowlist", () => {
  const rootFieldNames = () => {
    const queryType = narrowSchemaFor(schema).getQueryType()
    return Object.keys(queryType!.getFields()).sort()
  }

  it("exposes exactly the entry points the prompt documents", () => {
    expect(rootFieldNames()).toEqual([
      "artist",
      "artistSeries",
      "artistSeriesConnection",
      "artistsConnection",
      "artwork",
      "artworksConnection",
      "fair",
      "fairs",
      "gene",
      "genes",
      "marketingCollection",
      "marketingCollections",
      "matchConnection",
      "me",
      "showsConnection",
      "trendingSearches",
    ])
  })

  // Auction data hangs off Sale/SaleArtwork through meBiddersLoader and
  // lotStandingLoader -- the collector's own bidding, which is what the Me
  // allowlist exists to keep out of model context.
  it("keeps auctions out, reachable only as artworksConnection(atAuction:)", () => {
    expect(rootFieldNames()).not.toContain("sale")
    expect(rootFieldNames()).not.toContain("salesConnection")
    expect(rootFieldNames()).not.toContain("saleArtworksConnection")
  })

  // Each of these hangs its works off a differently-named connection, which
  // the prompt spells out; a rename upstream should fail here, not in a
  // retry loop at runtime.
  describe("the recipes the prompt gives for them", () => {
    const validationErrors = (query: string) =>
      validate(narrowSchemaFor(schema), parse(query), [...specifiedRules]).map(
        (error) => error.message
      )

    it.each([
      [
        "gene",
        '{ gene(id: "abstract-expressionism") { name filterArtworksConnection(first: 5) { edges { node { internalID } } } } }',
      ],
      [
        "artistSeries",
        '{ artistSeries(id: "andy-warhol-flowers") { title filterArtworksConnection(first: 5) { edges { node { internalID } } } } }',
      ],
      [
        "fair",
        '{ fair(id: "art-basel-2026") { name filterArtworksConnection(first: 5) { edges { node { internalID } } } } }',
      ],
      [
        "marketingCollection",
        '{ marketingCollection(slug: "prints-under-1000") { title artworksConnection(first: 5) { edges { node { internalID } } } } }',
      ],
      [
        "artistSeriesConnection",
        '{ artistSeriesConnection(artistID: "4d8b92b34eb68a1b2c000452", first: 5) { edges { node { slug title } } } }',
      ],
      [
        "fairs",
        "{ fairs(status: RUNNING, sort: START_AT_ASC, size: 5) { slug name startAt endAt } }",
      ],
      ["genes", '{ genes(slugs: ["minimalism"]) { name slug } }'],
      [
        "marketingCollections",
        "{ marketingCollections(size: 5) { slug title } }",
      ],
    ])("validates the %s recipe", (_name, query) => {
      expect(validationErrors(query)).toEqual([])
    })
  })
})

describe("the Me field allowlist", () => {
  // `me` is the one root field whose *fields* are gated too: it resolves the
  // signed-in collector's own record, so root-field filtering alone would put
  // their orders, messages and payment details inside a model-authored query.
  it("reaches the personalization connections", async () => {
    const meLoader = jest.fn()
    const savedArtworksLoader = jest.fn().mockResolvedValue({
      body: [{ _id: "5d8b92b34eb68a1b2c000111" }],
    })
    const similarArtworksLoader = jest.fn().mockResolvedValue([
      {
        _id: "5d8b92b34eb68a1b2c000222",
        id: "similar-work",
        title: "Similar Work",
      },
    ])
    const context = ({
      userID: "user-42",
      meLoader,
      savedArtworksLoader,
      similarArtworksLoader,
    } as unknown) as ResolverContext

    const result = await runQueryArtsyTool(
      {
        query: `
          {
            me {
              basedOnUserSaves(first: 5) {
                edges { node { internalID slug title } }
              }
            }
          }
        `,
      },
      schema,
      context
    )

    expect(result.ok).toBe(true)
    const data = JSON.parse(result.content)
    expect(data.me.basedOnUserSaves.edges).toEqual([
      {
        node: {
          internalID: "5d8b92b34eb68a1b2c000222",
          slug: "similar-work",
          title: "Similar Work",
        },
      },
    ])
    // Anchored on the collector's most recent saves, per basedOnUserSaves.
    expect(savedArtworksLoader).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: "user-42", sort: "-position" })
    )
    expect(similarArtworksLoader).toHaveBeenCalledWith(
      expect.objectContaining({ artwork_id: ["5d8b92b34eb68a1b2c000111"] })
    )
  })

  it("reaches the collector's own saved works and followed artists", async () => {
    const result = await runQueryArtsyTool(
      {
        query: `
          {
            me {
              followsAndSaves {
                artworksConnection(first: 5) { edges { node { internalID } } }
                artistsConnection(first: 5) { edges { node { internalID } } }
              }
            }
          }
        `,
      },
      schema,
      ({ userID: "user-42" } as unknown) as ResolverContext
    )

    // No loaders on the context, so this stops at resolution rather than
    // returning data — the point is that it passed *validation*.
    expect(result.content).not.toMatch(/Cannot query field/i)
  })

  it("hides the rest of the collector's record, including their identity", async () => {
    const privateFields = [
      "internalID",
      "name",
      "email",
      "phone",
      "creditCards { internalID }",
      "bankAccounts(first: 1) { edges { node { internalID } } }",
      "conversationsConnection(first: 1) { edges { node { internalID } } }",
      "addressConnection(first: 1) { edges { node { internalID } } }",
      "identityVerification { internalID }",
    ]

    for (const field of privateFields) {
      const result = await runQueryArtsyTool(
        { query: `{ me { ${field} } }` },
        schema,
        {} as ResolverContext
      )

      expect(result.ok).toBe(false)
      expect(result.content).toMatch(/Cannot query field/i)
    }
  })

  it("blocks the follows connections it doesn't allowlist", async () => {
    // `followsAndSaves` is allowlisted down to two of its eight connections.
    // Without this, a rename of the inline `FollowsAndSaves` type would make
    // all of the collector's follows reachable again and nothing would fail.
    const blocked = [
      "showsConnection",
      "fairsConnection",
      "galleriesConnection",
      "genesConnection",
      "profilesConnection",
      "bundledArtworksByArtistConnection",
    ]

    for (const field of blocked) {
      const result = await runQueryArtsyTool(
        {
          query: `{ me { followsAndSaves { ${field}(first: 1) { edges { node { internalID } } } } } }`,
        },
        schema,
        {} as ResolverContext
      )

      expect(result.ok).toBe(false)
      expect(result.content).toMatch(/Cannot query field/i)
    }
  })

  it("refuses to build the narrowed schema if an allowlisted type is renamed", () => {
    // The allowlist keys on a type name, which is the one way it fails open.
    // Every other test in this file exercises the same guard implicitly --
    // rename `Me` and they all go red on this message rather than quietly
    // passing against an unrestricted `Me`.
    const renamed = mapSchema(schema, {
      [MapperKind.OBJECT_TYPE]: (type) =>
        type.name === "FollowsAndSaves"
          ? new GraphQLObjectType({ ...type.toConfig(), name: "FollowsSaves" })
          : type,
    })

    expect(() => narrowSchemaFor(renamed)).toThrow(
      /unknown type\(s\).*FollowsAndSaves/s
    )
  })

  it("keeps the never-throws contract when the allowlist stops matching", () => {
    // The guard above throws, but `runQueryArtsyTool` is documented never to
    // -- a caller adding a second call site shouldn't have to know that
    // building the narrowed schema is the one step that can reject.
    const renamed = mapSchema(schema, {
      [MapperKind.OBJECT_TYPE]: (type) =>
        type.name === "FollowsAndSaves"
          ? new GraphQLObjectType({ ...type.toConfig(), name: "FollowsSaves" })
          : type,
    })

    return expect(
      runQueryArtsyTool(
        {
          query:
            "{ me { basedOnUserSaves(first: 1) { edges { node { internalID } } } } }",
        },
        renamed,
        {} as ResolverContext
      )
    ).resolves.toEqual({ ok: false, content: "The query could not be run." })
  })

  it("keeps `id`, so the filtered Me still satisfies the Node interface", async () => {
    // Dropping it would leave `Me implements Node` without `id` — an invalid
    // schema, which would break every query, not just this one.
    const result = await runQueryArtsyTool(
      { query: "{ me { id } }" },
      schema,
      {} as ResolverContext
    )

    expect(result.content).not.toMatch(/Cannot query field/i)
  })

  it("leaves field access on other types alone", async () => {
    const artistLoader = jest.fn().mockResolvedValue({
      _id: "4d8b92b34eb68a1b2c000452",
      id: "andy-warhol",
      name: "Andy Warhol",
    })

    const result = await runQueryArtsyTool(
      { query: '{ artist(id: "andy-warhol") { name birthday nationality } }' },
      schema,
      ({ artistLoader } as unknown) as ResolverContext
    )

    expect(result.ok).toBe(true)
  })
})

describe("introspection", () => {
  const context = ({} as unknown) as ResolverContext

  it("allows `__type`, which the system prompt tells the model to use", async () => {
    const result = await runQueryArtsyTool(
      {
        query: `{ __type(name: "Artwork") { fields { name type { name kind } } } }`,
      },
      schema,
      context
    )

    expect(result.ok).toBe(true)
    const data = JSON.parse(result.content)
    expect(data.__type.fields.length).toBeGreaterThan(0)
  })

  it("rejects `__schema`, which would return the entire type map", async () => {
    const result = await runQueryArtsyTool(
      { query: `{ __schema { types { name fields { name } } } }` },
      schema,
      context
    )

    expect(result.ok).toBe(false)
    expect(result.content).toMatch(/`__schema` is not available/)
  })

  it("points the model at the affordance that does work", async () => {
    const result = await runQueryArtsyTool(
      { query: `{ __schema { queryType { name } } }` },
      schema,
      context
    )

    expect(result.content).toMatch(/__type\(name: "TypeName"\)/)
  })

  it("catches `__schema` behind an alias or a fragment", async () => {
    const aliased = await runQueryArtsyTool(
      { query: `{ s: __schema { types { name } } }` },
      schema,
      context
    )
    const fragmented = await runQueryArtsyTool(
      {
        query: `{ ...F } fragment F on Query { __schema { types { name } } }`,
      },
      schema,
      context
    )

    expect(aliased.ok).toBe(false)
    expect(fragmented.ok).toBe(false)
  })
})

describe("tool result size cap", () => {
  // Depth, page size and complexity all price the *shape* of a query; none of
  // them can see how many bytes the resolvers actually return.
  const contextReturning = (name: string) =>
    (({
      artistLoader: jest.fn().mockResolvedValue({
        _id: "4d8b92b34eb68a1b2c000452",
        id: "andy-warhol",
        name,
      }),
    } as unknown) as ResolverContext)

  const query = `{ artist(id: "andy-warhol") { name } }`

  it("passes a normal-sized result through untouched, as parseable JSON", async () => {
    const result = await runQueryArtsyTool(
      { query },
      schema,
      contextReturning("Andy Warhol")
    )

    expect(result.ok).toBe(true)
    expect(JSON.parse(result.content)).toEqual({
      artist: { name: "Andy Warhol" },
    })
  })

  it("truncates a result that would otherwise flood the model's context", async () => {
    const result = await runQueryArtsyTool(
      { query },
      schema,
      contextReturning("x".repeat(200_000))
    )

    // Still a success -- the data is usable, just incomplete.
    expect(result.ok).toBe(true)
    expect(Buffer.byteLength(result.content, "utf8")).toBeLessThan(50_000)
  })

  it("tells the model the result is incomplete and how to narrow it", async () => {
    const result = await runQueryArtsyTool(
      { query },
      schema,
      contextReturning("x".repeat(200_000))
    )

    expect(result.content).toMatch(/\[Truncated:/)
    expect(result.content).toMatch(/fewer fields, or a smaller `first`/)
  })

  it("does not split a multi-byte character at the cut point", async () => {
    const result = await runQueryArtsyTool(
      { query },
      schema,
      // 3 bytes per character, so the cap lands mid-character.
      contextReturning("世".repeat(100_000))
    )

    expect(result.content).not.toMatch(/\uFFFD/)
  })
})

describe("summarizeToolCall", () => {
  it("extracts the root field being queried", () => {
    expect(
      summarizeToolCall({ query: '{ artist(id: "andy-warhol") { name } }' })
    ).toBe("Querying Artsy: artist…")
  })

  it("labels a trending query by trendingSearches, not the artwork nested in it", () => {
    expect(
      summarizeToolCall({
        query: "{ trendingSearches { artworks { artwork { slug } } } }",
      })
    ).toBe("Querying Artsy: trendingSearches…")
  })

  it("labels a personalized query by its field, not by the `me` wrapping it", () => {
    expect(
      summarizeToolCall({
        query:
          "{ me { basedOnUserSaves(first: 10) { edges { node { slug } } } } }",
      })
    ).toBe("Querying Artsy: basedOnUserSaves…")

    // The outer field wins over the `artworksConnection` nested inside it,
    // because the match is on the earliest position, not the listed order.
    expect(
      summarizeToolCall({
        query:
          "{ me { followsAndSaves { artworksConnection(first: 10) { edges { node { slug } } } } } }",
      })
    ).toBe("Querying Artsy: followsAndSaves…")
  })

  it("labels the entry point, not the connection nested under it", () => {
    expect(
      summarizeToolCall({
        query:
          '{ gene(id: "minimalism") { filterArtworksConnection(first: 5) { edges { node { internalID } } } } }',
      })
    ).toBe("Querying Artsy: gene…")
    expect(
      summarizeToolCall({
        query: '{ fair(id: "art-basel-2026") { name } }',
      })
    ).toBe("Querying Artsy: fair…")
  })

  it("falls back to a generic label when the root field can't be identified", () => {
    expect(summarizeToolCall({ query: "not graphql" })).toBe("Querying Artsy…")
    expect(summarizeToolCall({})).toBe("Querying Artsy…")
  })
})

describe("query complexity budget", () => {
  // These assertions are all about *validation*, which runs before execution,
  // so no loaders are needed — an empty context is enough.
  const context = ({} as unknown) as ResolverContext

  // Depth (8) and page size (20) are per-level caps; cost is their product.
  const NESTED_CONNECTIONS = `{
    artworksConnection(keyword: "a", first: 20) {
      edges { node { artist {
        artworksConnection(first: 20) { edges { node { title } } }
      } } }
    }
  }`

  it("rejects a nested connection that passes both the depth and page-size caps", async () => {
    const result = await runQueryArtsyTool(
      { query: NESTED_CONNECTIONS },
      schema,
      context
    )
    expect(result.ok).toBe(false)
    expect(result.content).toMatch(/too expensive/i)
    // Proves it is the complexity rule rejecting it, not depth or page size.
    expect(result.content).not.toMatch(
      /maximum operation depth|Page size too large/i
    )
  })

  it("explains how to make the query cheaper", async () => {
    const result = await runQueryArtsyTool(
      { query: NESTED_CONNECTIONS },
      schema,
      context
    )
    expect(result.content).toMatch(
      /Reduce `first`, or split this into separate queries/
    )
  })

  it("allows the same shape at a smaller page size", async () => {
    const result = await runQueryArtsyTool(
      {
        query: `{ artworksConnection(keyword: "a", first: 5) { edges { node { artist { artworksConnection(first: 5) { edges { node { title } } } } } } } }`,
      },
      schema,
      context
    )
    expect(result.content).not.toMatch(/too expensive/i)
  })

  it.each([
    [
      "match artist",
      `{ matchConnection(term: "banksy", entities: [ARTIST], first: 1) { edges { node { ... on Artist { internalID slug name } } } } }`,
    ],
    [
      "artist details",
      `{ artist(id: "banksy") { internalID slug name birthday nationality biographyBlurb { text } } }`,
    ],
    [
      "artworks by artist",
      `{ artworksConnection(artistIDs: ["a"], priceRange: "1-2", first: 20) { edges { node { internalID slug title artistNames saleMessage } } } }`,
    ],
    [
      "shows",
      `{ showsConnection(term: "London", status: RUNNING, first: 20) { edges { node { internalID slug name startAt endAt } } } }`,
    ],
    [
      "based on saves",
      `{ me { basedOnUserSaves(first: 20) { edges { node { internalID slug title artistNames saleMessage } } } } }`,
    ],
    [
      "own saves",
      `{ me { followsAndSaves { artworksConnection(first: 20) { edges { node { internalID slug title artistNames saleMessage } } } } } }`,
    ],
  ])("stays within budget for the %s recipe", async (_name, query) => {
    const result = await runQueryArtsyTool({ query }, schema, context)
    expect(result.content).not.toMatch(/too expensive/i)
  })

  // Scalars are free, so a wide-but-flat selection (one upstream call) must not
  // be penalised like a nested one.
  it("does not penalise a wide but flat selection", async () => {
    const wide = [
      "internalID",
      "slug",
      "title",
      "artistNames",
      "saleMessage",
      "href",
      "date",
      "medium",
      "category",
      "isSaved",
      "published",
      "availability",
      "priceCurrency",
      "imageRights",
      "provenance",
      "exhibitionHistory",
      "literature",
      "signature",
      "additionalInformation",
    ].join(" ")
    const result = await runQueryArtsyTool(
      {
        query: `{ artworksConnection(keyword: "a", first: 20) { edges { node { ${wide} } } } }`,
      },
      schema,
      context
    )
    expect(result.content).not.toMatch(/too expensive/i)
  })

  it("counts page sizes passed as variables, not just literals", async () => {
    const result = await runQueryArtsyTool(
      {
        query: `query ($n: Int) { artworksConnection(keyword: "a", first: $n) { edges { node { artist { artworksConnection(first: $n) { edges { node { title } } } } } } } }`,
        variables: { n: 20 },
      },
      schema,
      context
    )
    expect(result.ok).toBe(false)
    expect(result.content).toMatch(/too expensive/i)
  })

  it("reports a validation error, not a complexity crash, for an unknown field", async () => {
    const result = await runQueryArtsyTool(
      {
        query: `{ artworksConnection(keyword: "a", first: 2) { edges { node { notAField } } } }`,
      },
      schema,
      context
    )
    expect(result.ok).toBe(false)
    expect(result.content).toMatch(/Cannot query field/i)
  })
})

describe("upstream error sanitisation", () => {
  // lib/apis/fetch.ts builds messages as `<uri.href> - <body>`, so a raw
  // passthrough hands the model an internal URL — including its query string.
  const LEAKY =
    'https://stagingapi.artsy.net/api/v1/artist/foo?access_token=SECRET&size=20 - {"error":"Not Found"}'

  const runWithFailure = (error: Error) =>
    runQueryArtsyTool(
      { query: `{ artist(id: "foo") { internalID name } }` },
      schema,
      ({
        artistLoader: jest.fn().mockRejectedValue(error),
      } as unknown) as ResolverContext
    )

  it("does not leak the upstream host, path or query string to the model", async () => {
    const result = await runWithFailure(new HTTPError(LEAKY, 404))
    expect(result.ok).toBe(false)
    expect(result.content).not.toMatch(/stagingapi|artsy\.net|api\/v1/)
    expect(result.content).not.toMatch(/access_token|SECRET/)
    expect(result.content).not.toContain(LEAKY)
  })

  it("still tells the model what kind of failure it was, and where", async () => {
    const result = await runWithFailure(new HTTPError(LEAKY, 404))
    expect(result.content).toBe("No record found at `artist`")
  })

  it.each([
    [401, "Not authorized to read at `artist`"],
    [403, "Not authorized to read at `artist`"],
    [429, "Upstream rate limit reached at `artist` — wait before retrying"],
    [
      500,
      "Upstream service error at `artist` — the data source is unavailable",
    ],
    [
      503,
      "Upstream service error at `artist` — the data source is unavailable",
    ],
  ])("maps status %i to a safe category", async (status, expected) => {
    const result = await runWithFailure(new HTTPError(LEAKY, status as number))
    expect(result.content).toBe(expected)
  })

  it("falls back to a generic category for a non-HTTP error", async () => {
    const result = await runWithFailure(
      new Error("connect ECONNREFUSED 10.0.1.5:6379")
    )
    expect(result.content).toBe("Could not resolve at `artist`")
    expect(result.content).not.toMatch(/ECONNREFUSED|10\.0\.1\.5/)
  })
})
