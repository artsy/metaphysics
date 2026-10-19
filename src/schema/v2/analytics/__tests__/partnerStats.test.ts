import gql from "lib/gql"
import { HTTPError } from "lib/HTTPError"
import { createPartnerStatsLoader } from "lib/loaders/vortexPartnerStatsLoader"
import { runQuery } from "schema/v2/test/utils"

jest.mock("config", () => {
  const actualConfig = jest.requireActual("config").default
  return {
    __esModule: true,
    default: { ...actualConfig, USE_UNSTITCHED_VORTEX: true },
  }
})

const PARTNER_ID = "5748d153cd530e2d5100031c"

const timeSeries = (key: string, values: number[]) =>
  values.map((value, index) => ({
    start_time: `2019-05-0${index + 4}T00:00:00Z`,
    end_time: `2019-05-0${index + 5}T00:00:00Z`,
    [key]: value,
  }))

const SECTIONS = {
  sales: {
    total_cents: 3682500,
    order_count: 3,
    order_response_time: null,
    order_response_rate: 50.5,
    time_series: timeSeries("total_cents", [0, 280000, 120000]),
  },
  inquiry: {
    inquiry_count: 4,
    inquiry_response_time: -1,
    time_series: timeSeries("count", [1, 2, 3]),
  },
  audience: {
    unique_visitors: 10,
    commercial_visitors: 2,
    unique_visitors_percentage_changed: 5,
    commercial_visitors_percentage_changed: -3,
  },
  pageview: {
    total_count: 9,
    percentage_changed: 12,
    artwork_views: 4,
    gallery_views: 3,
    show_views: 2,
    unique_visitors: 7,
    time_series: timeSeries("count", [4, 5]),
  },
  artwork_published: {
    total_count: 3,
    percentage_changed: 0,
    time_series: timeSeries("count", [1, 2]),
  },
  ranked_stats: [
    { object_id: "artwork-1", object_type: "artwork", value: 30 },
    { object_id: "artwork-2", object_type: "artwork", value: 20 },
    { object_id: "artwork-3", object_type: "artwork", value: 10 },
  ],
  grouped_stats: [
    {
      name: "Germany",
      value: 3,
      percent: 75.0,
      metric: "visitor_by_location",
      type: "Country",
    },
    {
      name: "France",
      value: 1,
      percent: 25.0,
      metric: "visitor_by_location",
      type: "Country",
    },
  ],
}

// Vortex answers every requested period, keyed by period.
const mockREST = (sections = SECTIONS) =>
  jest.fn((section: string, { period }: Record<string, any>) =>
    Promise.resolve({
      data: Object.fromEntries(period.map((p) => [p, sections[section]])),
    })
  )

const buildContext = ({
  restLoader = mockREST(),
  ...context
}: Record<string, any> = {}) => ({
  partnerLoader: jest.fn(() => Promise.resolve({ _id: PARTNER_ID })),
  authenticatedLoaders: {
    vortexPartnerStatsLoader: createPartnerStatsLoader(restLoader),
    vortexUserStatsLoader: jest.fn(),
  },
  unauthenticatedLoaders: {},
  ...context,
})

const analyticsQuery = (selection: string) => gql`
  {
    partner(id: "${PARTNER_ID}") {
      analytics {
        ${selection}
      }
    }
  }
`

describe("Partner.analytics", () => {
  it("batches every period of a section into one Vortex request", async () => {
    const restLoader = mockREST()
    const context = buildContext({ restLoader })

    const result = await runQuery(
      analyticsQuery(`
        partnerId
        fourWeeks: sales(period: FOUR_WEEKS) { period totalCents }
        sixteenWeeks: sales(period: SIXTEEN_WEEKS) { period totalCents }
        oneYear: sales(period: ONE_YEAR) { period totalCents partnerId }
        inquiry(period: ONE_YEAR) { inquiryCount }
      `),
      context
    )

    expect(restLoader).toHaveBeenCalledTimes(2)
    expect(restLoader).toHaveBeenCalledWith("sales", {
      partner_id: PARTNER_ID,
      period: ["FOUR_WEEKS", "SIXTEEN_WEEKS", "ONE_YEAR"],
    })
    expect(restLoader).toHaveBeenCalledWith("inquiry", {
      partner_id: PARTNER_ID,
      period: ["ONE_YEAR"],
    })
    expect(context.partnerLoader).not.toHaveBeenCalled()
    expect(result.partner.analytics).toEqual({
      partnerId: PARTNER_ID,
      fourWeeks: { period: "FOUR_WEEKS", totalCents: 3682500 },
      sixteenWeeks: { period: "SIXTEEN_WEEKS", totalCents: 3682500 },
      oneYear: {
        period: "ONE_YEAR",
        totalCents: 3682500,
        partnerId: PARTNER_ID,
      },
      inquiry: { inquiryCount: 4 },
    })
  })

  it("batches sections selected through fragments and passes their params", async () => {
    const restLoader = mockREST()

    await runQuery(
      gql`
        query($period: AnalyticsQueryPeriodEnum!) {
          partner(id: "${PARTNER_ID}") {
            analytics {
              ...Ranked
              ... on AnalyticsPartnerStats {
                groupedStats(
                  objectType: COUNTRY
                  metric: VISITOR_BY_LOCATION
                  period: $period
                ) {
                  nodes { period }
                }
              }
            }
          }
        }
        fragment Ranked on AnalyticsPartnerStats {
          a: rankedStats(objectType: ARTWORK, period: FOUR_WEEKS) { nodes { value } }
          b: rankedStats(objectType: ARTWORK, period: $period) { nodes { value } }
          c: rankedStats(objectType: SHOW, period: $period) { nodes { value } }
        }
      `,
      buildContext({ restLoader }),
      { period: "ONE_YEAR" }
    )

    expect(restLoader.mock.calls).toEqual([
      [
        "ranked_stats",
        {
          partner_id: PARTNER_ID,
          period: ["FOUR_WEEKS", "ONE_YEAR"],
          object_type: "ARTWORK",
        },
      ],
      [
        "ranked_stats",
        { partner_id: PARTNER_ID, period: ["ONE_YEAR"], object_type: "SHOW" },
      ],
      [
        "grouped_stats",
        {
          partner_id: PARTNER_ID,
          period: ["ONE_YEAR"],
          object_type: "COUNTRY",
          metric: "VISITOR_BY_LOCATION",
        },
      ],
    ])
  })

  it("maps every section's snake_case keys", async () => {
    const result = await runQuery(
      analyticsQuery(`
        sales(period: FOUR_WEEKS) {
          partnerId orderCount orderResponseRate orderResponseTime totalCents
        }
        inquiry(period: FOUR_WEEKS) { inquiryCount inquiryResponseTime }
        audience(period: FOUR_WEEKS) {
          partnerId period uniqueVisitors commercialVisitors
          uniqueVisitorsPercentageChanged commercialVisitorsPercentageChanged
        }
        pageview(period: FOUR_WEEKS) {
          totalCount percentageChanged artworkViews galleryViews showViews
          uniqueVisitors
          timeSeries { startTime endTime count }
        }
        artworkPublished(period: FOUR_WEEKS) {
          totalCount percentageChanged timeSeries { count }
        }
      `),
      buildContext()
    )

    expect(result.partner.analytics).toEqual({
      sales: {
        partnerId: PARTNER_ID,
        orderCount: 3,
        orderResponseRate: 50.5,
        orderResponseTime: null,
        totalCents: 3682500,
      },
      inquiry: { inquiryCount: 4, inquiryResponseTime: -1 },
      audience: {
        partnerId: PARTNER_ID,
        period: "FOUR_WEEKS",
        uniqueVisitors: 10,
        commercialVisitors: 2,
        uniqueVisitorsPercentageChanged: 5,
        commercialVisitorsPercentageChanged: -3,
      },
      pageview: {
        totalCount: 9,
        percentageChanged: 12,
        artworkViews: 4,
        galleryViews: 3,
        showViews: 2,
        uniqueVisitors: 7,
        timeSeries: [
          {
            startTime: "2019-05-04T00:00:00Z",
            endTime: "2019-05-05T00:00:00Z",
            count: 4,
          },
          {
            startTime: "2019-05-05T00:00:00Z",
            endTime: "2019-05-06T00:00:00Z",
            count: 5,
          },
        ],
      },
      artworkPublished: {
        totalCount: 3,
        percentageChanged: 0,
        timeSeries: [{ count: 1 }, { count: 2 }],
      },
    })
  })

  it("reads the deprecated sections from their legacy endpoints", async () => {
    const restLoader = mockREST({
      ...SECTIONS,
      pageviews: { ...SECTIONS.pageview, total_count: 99 },
      artworks_published: { ...SECTIONS.artwork_published, total_count: 98 },
    } as any)

    const result = await runQuery(
      analyticsQuery(`
        pageviews(period: ONE_YEAR) { totalCount period timeSeries { count } }
        artworksPublished(period: ONE_YEAR) { totalCount }
      `),
      buildContext({ restLoader })
    )

    expect(restLoader.mock.calls.map(([section]) => section)).toEqual([
      "pageviews",
      "artworks_published",
    ])
    expect(result.partner.analytics).toEqual({
      pageviews: {
        totalCount: 99,
        period: "ONE_YEAR",
        timeSeries: [{ count: 4 }, { count: 5 }],
      },
      artworksPublished: { totalCount: 98 },
    })
  })

  it("returns null for the deprecated fields Vortex never resolved", async () => {
    const restLoader = mockREST()

    const result = await runQuery(
      analyticsQuery(`
        uniqueVisitors(period: FOUR_WEEKS)
        topArtworks { edges { node { value } } }
      `),
      buildContext({ restLoader })
    )

    expect(result.partner.analytics).toEqual({
      uniqueVisitors: null,
      topArtworks: null,
    })
    expect(restLoader).not.toHaveBeenCalled()
  })

  describe("time series", () => {
    it("sums the buckets when cumulative", async () => {
      const result = await runQuery(
        analyticsQuery(`
          inquiry(period: FOUR_WEEKS) {
            timeSeries(cumulative: true) { count }
            nonCumulative: timeSeries { count }
          }
          pageview(period: FOUR_WEEKS) {
            timeSeries(cumulative: true) { count }
          }
          artworkPublished(period: FOUR_WEEKS) {
            timeSeries(cumulative: true) { count }
          }
          sales(period: FOUR_WEEKS) {
            timeSeries(cumulative: true) { count totalCents total }
          }
        `),
        buildContext()
      )

      expect(result.partner.analytics).toEqual({
        inquiry: {
          timeSeries: [{ count: 1 }, { count: 3 }, { count: 6 }],
          nonCumulative: [{ count: 1 }, { count: 2 }, { count: 3 }],
        },
        pageview: { timeSeries: [{ count: 4 }, { count: 9 }] },
        artworkPublished: { timeSeries: [{ count: 1 }, { count: 3 }] },
        sales: {
          timeSeries: [
            { count: null, totalCents: 0, total: "$0" },
            { count: null, totalCents: 280000, total: "$2,800" },
            { count: null, totalCents: 400000, total: "$4,000" },
          ],
        },
      })
    })
  })

  describe("sales", () => {
    it("formats total fields", async () => {
      const result = await runQuery(
        analyticsQuery(`
          sales(period: FOUR_WEEKS) {
            partnerId
            totalCents
            total
            timeSeries {
              startTime
              endTime
              totalCents
              total(
                symbol: "¥"
                precision: 3
                format: "%v %s"
                thousand: "|"
                decimal: "。"
              )
            }
          }
        `),
        buildContext({
          restLoader: mockREST({
            ...SECTIONS,
            sales: {
              ...SECTIONS.sales,
              time_series: timeSeries("total_cents", [0, 280000]),
            },
          }),
        })
      )

      expect(result).toMatchInlineSnapshot(`
        {
          "partner": {
            "analytics": {
              "sales": {
                "partnerId": "5748d153cd530e2d5100031c",
                "timeSeries": [
                  {
                    "endTime": "2019-05-05T00:00:00Z",
                    "startTime": "2019-05-04T00:00:00Z",
                    "total": "0。000 ¥",
                    "totalCents": 0,
                  },
                  {
                    "endTime": "2019-05-06T00:00:00Z",
                    "startTime": "2019-05-05T00:00:00Z",
                    "total": "2|800。000 ¥",
                    "totalCents": 280000,
                  },
                ],
                "total": "$36,825",
                "totalCents": 3682500,
              },
            },
          },
        }
      `)
    })
  })

  describe("rankedStats", () => {
    const artwork = {
      id: "lona-misa",
      _id: "artwork-1",
      artist: { id: "artist-slug", _id: "artist-id" },
      category: "Painting",
      title: "Lona Misa",
    }

    const rankedQuery = (partnerId: string) => gql`
      {
        partner(id: "${partnerId}") {
          analytics {
            rankedStats(first: 1, objectType: ARTWORK, period: ONE_YEAR) {
              edges {
                node {
                  value
                  period
                  rankedEntity {
                    __typename
                    ... on AnalyticsArtwork { entityId }
                  }
                  entity {
                    __typename
                    ... on Artwork { title }
                  }
                }
              }
              pageInfo { hasNextPage }
            }
          }
        }
      }
    `

    it("resolves the ranked entity through the local root field without loading the partner", async () => {
      const artworkLoader = jest.fn(() => Promise.resolve(artwork))
      const context = buildContext({ artworkLoader })

      const result = await runQuery(rankedQuery(PARTNER_ID), context)

      expect(context.partnerLoader).not.toHaveBeenCalled()
      expect(artworkLoader).toHaveBeenCalledWith("artwork-1")
      expect(result.partner.analytics.rankedStats).toEqual({
        edges: [
          {
            node: {
              value: 30,
              period: "ONE_YEAR",
              rankedEntity: {
                __typename: "AnalyticsArtwork",
                entityId: "artwork-1",
              },
              entity: { __typename: "Artwork", title: "Lona Misa" },
            },
          },
        ],
        pageInfo: { hasNextPage: true },
      })
    })

    it("loads the partner to get its id when queried by slug", async () => {
      const context = buildContext({
        artworkLoader: jest.fn(() => Promise.resolve(artwork)),
      })

      const result = await runQuery(rankedQuery("partner-slug"), context)

      expect(context.partnerLoader).toHaveBeenCalledWith("partner-slug")
      expect(
        result.partner.analytics.rankedStats.edges[0].node.entity.title
      ).toEqual("Lona Misa")
    })

    it("resolves each entity type", async () => {
      const restLoader = mockREST({
        ...SECTIONS,
        ranked_stats: [
          { object_id: "artist-1", object_type: "artist", value: 4 },
          { object_id: "show-1", object_type: "show", value: 3 },
          { object_id: "room-1", object_type: "viewing-room", value: 2 },
        ],
      })

      const result = await runQuery(
        analyticsQuery(`
          rankedStats(objectType: ARTIST, period: ONE_YEAR) {
            nodes {
              rankedEntity {
                __typename
                ... on AnalyticsArtist { entityId }
                ... on AnalyticsShow { entityId }
                ... on AnalyticsViewingRoom { entityId }
              }
            }
          }
        `),
        buildContext({ restLoader })
      )

      expect(result.partner.analytics.rankedStats.nodes).toEqual([
        {
          rankedEntity: { __typename: "AnalyticsArtist", entityId: "artist-1" },
        },
        { rankedEntity: { __typename: "AnalyticsShow", entityId: "show-1" } },
        {
          rankedEntity: {
            __typename: "AnalyticsViewingRoom",
            entityId: "room-1",
          },
        },
      ])
    })

    it("errors on a hidden show, as the stitched field did", async () => {
      const restLoader = mockREST({
        ...SECTIONS,
        ranked_stats: [{ object_id: "show-1", object_type: "show", value: 3 }],
      })
      const showLoader = jest.fn(() =>
        Promise.resolve({ id: "show-1", name: "Hidden", displayable: false })
      )

      await expect(
        runQuery(
          analyticsQuery(`
            rankedStats(objectType: SHOW, period: ONE_YEAR) {
              nodes { entity { ... on Show { name } } }
            }
          `),
          buildContext({ restLoader, showLoader })
        )
      ).rejects.toThrow("Show Not Found")
    })

    it("caps pages at 20 like Vortex's max_page_size", async () => {
      const rows = Array.from({ length: 25 }, (_, index) => ({
        object_id: `artwork-${index}`,
        object_type: "artwork",
        value: 25 - index,
      }))
      const restLoader = mockREST({ ...SECTIONS, ranked_stats: rows })

      const result = await runQuery(
        analyticsQuery(`
          capped: rankedStats(first: 50, objectType: ARTWORK, period: ONE_YEAR) {
            nodes { value }
          }
          default: rankedStats(objectType: ARTWORK, period: ONE_YEAR) {
            nodes { value }
          }
        `),
        buildContext({ restLoader })
      )

      expect(result.partner.analytics.capped.nodes).toHaveLength(20)
      expect(result.partner.analytics.default.nodes).toHaveLength(20)
    })
  })

  describe("groupedStats", () => {
    it("paginates the grouped entities", async () => {
      const result = await runQuery(
        analyticsQuery(`
          groupedStats(
            first: 1
            objectType: COUNTRY
            metric: VISITOR_BY_LOCATION
            period: SIXTEEN_WEEKS
          ) {
            edges {
              node {
                period
                groupedEntity {
                  __typename
                  ... on AnalyticsVisitorsByCountry {
                    name value percent metric type
                  }
                }
              }
            }
            pageInfo { hasNextPage }
          }
        `),
        buildContext()
      )

      expect(result.partner.analytics.groupedStats).toEqual({
        edges: [
          {
            node: {
              period: "SIXTEEN_WEEKS",
              groupedEntity: {
                __typename: "AnalyticsVisitorsByCountry",
                name: "Germany",
                value: 3,
                percent: 75,
                metric: "visitor_by_location",
                type: "Country",
              },
            },
          },
        ],
        pageInfo: { hasNextPage: true },
      })
    })
  })

  describe("errors", () => {
    it("fails analytics when Vortex rejects the token", async () => {
      const restLoader = jest.fn(() =>
        Promise.reject(new HTTPError("Forbidden", 403))
      )

      await expect(
        runQuery(
          analyticsQuery(`sales(period: FOUR_WEEKS) { totalCents }`),
          buildContext({ restLoader })
        )
      ).rejects.toThrow("Forbidden")
    })

    it("fails only the section for other errors", async () => {
      const restLoader = jest.fn((section: string, { period }) =>
        section === "sales"
          ? Promise.reject(new HTTPError("Boom", 500))
          : Promise.resolve({
              data: Object.fromEntries(
                period.map((p) => [p, SECTIONS[section]])
              ),
            })
      )
      const { graphql } = require("graphql")
      const { schema } = require("schema/v2")

      const result = await graphql({
        schema,
        source: analyticsQuery(`
          sales(period: FOUR_WEEKS) { totalCents }
          inquiry(period: FOUR_WEEKS) { inquiryCount }
        `),
        contextValue: buildContext({ restLoader }),
      })

      expect(result.data.partner.analytics).toEqual({
        sales: null,
        inquiry: { inquiryCount: 4 },
      })
      expect(result.errors.map(({ path }) => path)).toEqual([
        ["partner", "analytics", "sales"],
      ])
    })
  })

  describe("token selection", () => {
    const EMAIL_PROVIDER_APP_TOKEN = [
      "eyJhbGciOiJIUzI1NiJ9",
      Buffer.from(JSON.stringify({ roles: "email_provider" })).toString(
        "base64url"
      ),
      "signature",
    ].join(".")

    const contexts = () => {
      const authenticated = mockREST()
      const unauthenticated = mockREST()
      return {
        authenticated,
        unauthenticated,
        loaders: {
          authenticatedLoaders: {
            vortexPartnerStatsLoader: createPartnerStatsLoader(authenticated),
          },
          unauthenticatedLoaders: {
            vortexPartnerStatsLoader: createPartnerStatsLoader(unauthenticated),
          },
        },
      }
    }

    const query = analyticsQuery(
      `audience(period: FOUR_WEEKS) { uniqueVisitors }`
    )

    it("uses the user's Vortex token when there is a user", async () => {
      const { authenticated, unauthenticated, loaders } = contexts()

      await runQuery(query, buildContext(loaders))

      expect(authenticated).toHaveBeenCalled()
      expect(unauthenticated).not.toHaveBeenCalled()
    })

    it("passes an email provider's app token on, like the stitched link", async () => {
      const { authenticated, unauthenticated, loaders } = contexts()

      await runQuery(
        query,
        buildContext({ ...loaders, appToken: EMAIL_PROVIDER_APP_TOKEN })
      )

      expect(authenticated).not.toHaveBeenCalled()
      expect(unauthenticated).toHaveBeenCalled()
    })

    it("uses the unauthenticated loader without a user", async () => {
      const { unauthenticated, loaders } = contexts()

      await runQuery(
        query,
        buildContext({
          authenticatedLoaders: {},
          unauthenticatedLoaders: loaders.unauthenticatedLoaders,
        })
      )

      expect(unauthenticated).toHaveBeenCalled()
    })
  })
})

describe("User.analytics", () => {
  it("loads the user's stats from Vortex", async () => {
    const vortexUserStatsLoader = jest.fn(() =>
      Promise.resolve({
        data: { user_id: "user-1", total_purchase_count: 3 },
      })
    )

    const result = await runQuery(
      gql`
        {
          user(id: "user-1") {
            analytics {
              userId
              totalPurchaseCount
            }
          }
        }
      `,
      {
        userByIDLoader: jest.fn(() => Promise.resolve({ id: "user-1" })),
        authenticatedLoaders: { vortexUserStatsLoader },
        unauthenticatedLoaders: {},
      } as any
    )

    expect(vortexUserStatsLoader).toHaveBeenCalledWith({ user_id: "user-1" })
    expect(result).toEqual({
      user: { analytics: { userId: "user-1", totalPurchaseCount: 3 } },
    })
  })
})
