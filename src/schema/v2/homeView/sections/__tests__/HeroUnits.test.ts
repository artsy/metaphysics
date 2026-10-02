import { offsetToCursor } from "graphql-relay"
import gql from "lib/gql"
import { runQuery } from "schema/v2/test/utils"

const BEFORE_WINDOW = Date.parse("2026-10-04T12:00:00Z")
const IN_WINDOW = Date.parse("2026-10-10T12:00:00Z")
const AFTER_WINDOW = Date.parse("2026-10-25T12:00:00Z")

describe("HeroUnits", () => {
  const setNow = (now: number) => jest.spyOn(Date, "now").mockReturnValue(now)

  beforeEach(() => {
    setNow(BEFORE_WINDOW)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it("returns the section's metadata", async () => {
    const query = gql`
      {
        homeView {
          section(id: "home-view-section-hero-units") {
            __typename
            internalID
            contextModule
            ownerType
            component {
              title
              description
              behaviors {
                viewAll {
                  buttonText
                  href
                  ownerType
                }
              }
            }
          }
        }
      }
    `

    const context = {}

    const { homeView } = await runQuery(query, context)

    expect(homeView.section).toMatchInlineSnapshot(`
      {
        "__typename": "HomeViewSectionHeroUnits",
        "component": null,
        "contextModule": "heroUnitsRail",
        "internalID": "home-view-section-hero-units",
        "ownerType": null,
      }
    `)
  })

  it("returns the section's connection data", async () => {
    const query = gql`
      {
        homeView {
          section(id: "home-view-section-hero-units") {
            ... on HomeViewSectionHeroUnits {
              heroUnitsConnection(first: 2) {
                edges {
                  node {
                    title
                  }
                }
              }
            }
          }
        }
      }
    `

    const mockHeroUnitsResponse = {
      body: [
        {
          title: "Foundations Summer 2024",
        },
        {
          title: "Foundations Prize Finalists",
        },
      ],
      headers: { "x-total-count": 2 },
    }

    const context = {
      heroUnitsLoader: jest.fn().mockReturnValue(mockHeroUnitsResponse),
    }

    const { homeView } = await runQuery(query, context)

    expect(homeView.section).toMatchInlineSnapshot(`
      {
        "heroUnitsConnection": {
          "edges": [
            {
              "node": {
                "title": "Foundations Summer 2024",
              },
            },
            {
              "node": {
                "title": "Foundations Prize Finalists",
              },
            },
          ],
        },
      }
    `)
  })

  describe("featured city guide hero unit", () => {
    const query = gql`
      query($first: Int, $after: String, $last: Int, $before: String) {
        homeView {
          section(id: "home-view-section-hero-units") {
            ... on HomeViewSectionHeroUnits {
              heroUnitsConnection(
                first: $first
                after: $after
                last: $last
                before: $before
              ) {
                totalCount
                pageInfo {
                  hasNextPage
                  startCursor
                  endCursor
                }
                edges {
                  cursor
                  node {
                    internalID
                    title
                    body
                    link {
                      text
                      url
                    }
                    image {
                      url
                      width
                      height
                      aspectRatio
                    }
                  }
                }
              }
            }
          }
        }
      }
    `

    const gravityUnits = ["A", "B", "C", "D", "E", "F"].map((title) => ({
      id: title.toLowerCase(),
      title,
      body: `${title} body`,
      link_text: "Go",
      link_url: "/go",
    }))

    // Serves pages the way Gravity does, from `page` and `size`
    const buildContext = (units = gravityUnits) => ({
      heroUnitsLoader: jest.fn(({ page, size }) =>
        Promise.resolve({
          body: units.slice((page - 1) * size, page * size),
          headers: { "x-total-count": String(units.length) },
        })
      ),
    })

    const fetchPage = async (variables, context = buildContext()) => {
      const { homeView } = await runQuery(query, context, variables)
      return homeView.section.heroUnitsConnection
    }

    const titles = (connection) => connection.edges.map((e) => e.node.title)

    it("puts the London Art Week unit first while the window is open", async () => {
      setNow(IN_WINDOW)

      const connection = await fetchPage({ first: 5 })

      expect(titles(connection)).toEqual([
        "Your Guide to London Art Week",
        "A",
        "B",
        "C",
        "D",
        "E",
      ])
      expect(connection.totalCount).toBe(7)
      expect(connection.edges[0].node).toMatchObject({
        internalID: "london-art-week-2026",
        body: "All the art highlights between Oct. 14–19.",
        link: {
          text: "Explore Now",
          url: "/city-guide?citySlug=london-united-kingdom",
        },
        image: {
          url: "https://files.artsy.net/images/image-1-1.png",
          width: 360,
          height: 630,
          aspectRatio: 360 / 630,
        },
      })
      expect(connection.pageInfo.startCursor).toBe(connection.edges[0].cursor)
    })

    it("returns every Gravity unit exactly once across pages", async () => {
      setNow(IN_WINDOW)

      const seen: string[] = []
      let after: string | undefined
      let hasNextPage = true

      while (hasNextPage) {
        const connection = await fetchPage({ first: 2, after })
        seen.push(...titles(connection))
        after = connection.pageInfo.endCursor
        hasNextPage = connection.pageInfo.hasNextPage
      }

      expect(seen).toEqual([
        "Your Guide to London Art Week",
        "A",
        "B",
        "C",
        "D",
        "E",
        "F",
      ])
    })

    it("returns just the unit when Gravity has none", async () => {
      setNow(IN_WINDOW)

      const connection = await fetchPage({ first: 5 }, buildContext([]))

      expect(titles(connection)).toEqual(["Your Guide to London Art Week"])
      expect(connection.pageInfo.hasNextPage).toBe(false)
      expect(connection.pageInfo.endCursor).toBe(connection.edges[0].cursor)
    })

    it("leaves backward paging alone", async () => {
      setNow(IN_WINDOW)

      const connection = await fetchPage({
        last: 2,
        before: offsetToCursor(4),
      })

      expect(titles(connection)).not.toContain("Your Guide to London Art Week")
    })

    it("adds nothing when no items are requested", async () => {
      setNow(IN_WINDOW)

      const connection = await fetchPage({ first: 0 })

      expect(connection.edges).toEqual([])
    })

    it.each([
      ["before", BEFORE_WINDOW],
      ["after", AFTER_WINDOW],
    ])("is not shown %s the window", async (_label, now) => {
      setNow(now)

      const connection = await fetchPage({ first: 5 })

      expect(titles(connection)).toEqual(["A", "B", "C", "D", "E"])
      expect(connection.totalCount).toBe(6)
    })
  })
})
