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
      query($first: Int, $after: String) {
        homeView {
          section(id: "home-view-section-hero-units") {
            ... on HomeViewSectionHeroUnits {
              heroUnitsConnection(first: $first, after: $after) {
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
                    }
                  }
                }
              }
            }
          }
        }
      }
    `

    const gravityUnits = ["A", "B"].map((title) => ({
      id: title.toLowerCase(),
      title,
      body: `${title} body`,
      link_text: "Go",
      link_url: "/go",
    }))

    const buildContext = () => ({
      heroUnitsLoader: jest.fn().mockResolvedValue({
        body: gravityUnits,
        headers: { "x-total-count": "2" },
      }),
    })

    const titles = (connection) => connection.edges.map((e) => e.node.title)

    it("puts the London Art Week unit first while the window is open", async () => {
      setNow(IN_WINDOW)

      const { homeView } = await runQuery(query, buildContext(), { first: 5 })
      const connection = homeView.section.heroUnitsConnection

      expect(titles(connection)).toEqual([
        "Your Guide to London Art Week",
        "A",
        "B",
      ])
      expect(connection.totalCount).toBe(3)
      expect(connection.edges[0].node).toMatchObject({
        internalID: "london-art-week-2026",
        body: "All the art highlights between Oct. 14–19.",
        link: {
          text: "Explore Now",
          url: "/city-guide?citySlug=london-united-kingdom",
        },
        image: {
          url:
            "https://files.artsy.net/images/e7697c5f36292b4d34bc00d0e46e22d44966284b.png",
          width: 2880,
          height: 1200,
        },
      })
      expect(connection.pageInfo.startCursor).toBe(connection.edges[0].cursor)
    })

    it("keeps the page within `first` and reports a next page", async () => {
      setNow(IN_WINDOW)

      const { homeView } = await runQuery(query, buildContext(), { first: 2 })
      const connection = homeView.section.heroUnitsConnection

      expect(titles(connection)).toEqual(["Your Guide to London Art Week", "A"])
      expect(connection.pageInfo.hasNextPage).toBe(true)
      expect(connection.pageInfo.endCursor).toBe(connection.edges[1].cursor)
    })

    it("does not add the unit to later pages", async () => {
      setNow(IN_WINDOW)

      const first = await runQuery(query, buildContext(), { first: 2 })
      const { endCursor } = first.homeView.section.heroUnitsConnection.pageInfo

      const { homeView } = await runQuery(query, buildContext(), {
        first: 2,
        after: endCursor,
      })

      expect(titles(homeView.section.heroUnitsConnection)).not.toContain(
        "Your Guide to London Art Week"
      )
    })

    it.each([
      ["before", BEFORE_WINDOW],
      ["after", AFTER_WINDOW],
    ])("is not shown %s the window", async (_label, now) => {
      setNow(now)

      const { homeView } = await runQuery(query, buildContext(), { first: 5 })
      const connection = homeView.section.heroUnitsConnection

      expect(titles(connection)).toEqual(["A", "B"])
      expect(connection.totalCount).toBe(2)
    })
  })
})
