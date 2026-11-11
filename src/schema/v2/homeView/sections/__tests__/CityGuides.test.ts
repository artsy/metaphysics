import gql from "lib/gql"
import { isFeatureFlagEnabled } from "lib/featureFlags"
import { runQuery } from "schema/v2/test/utils"
import { countLabel, HOME_VIEW_CITY_GUIDE_SLUGS } from "../CityGuides"

jest.mock("lib/featureFlags", () => ({
  isFeatureFlagEnabled: jest.fn(),
}))

const mockIsFeatureFlagEnabled = isFeatureFlagEnabled as jest.Mock

const withTotalCount = (count: number) =>
  Promise.resolve({ body: [], headers: { "x-total-count": `${count}` } })

const cardsQuery = gql`
  {
    homeView {
      section(id: "home-view-section-city-guides") {
        ... on HomeViewSectionCityGuides {
          cardsConnection(first: 10) {
            edges {
              node {
                citySlug
                title
                href
                chips
              }
            }
          }
        }
      }
    }
  }
`

const buildLoaders = () => ({
  // London: 6 guides, 80 running + 9 opening. Every other city: 0 guides, 60 + 50.
  showsWithHeadersLoader: jest.fn(({ near, status }) => {
    const isLondon = near === "51.51,-0.13"
    if (status === "running") return withTotalCount(isLondon ? 80 : 60)
    return withTotalCount(isLondon ? 9 : 50)
  }),
  itinerariesLoader: jest.fn(({ city_slug }) =>
    withTotalCount(city_slug === "london-united-kingdom" ? 6 : 0)
  ),
})

describe("CityGuides", () => {
  beforeEach(() => {
    mockIsFeatureFlagEnabled.mockImplementation(
      (flag) => flag === "onyx_home-view-city-guide"
    )
  })

  describe("displayability", () => {
    const query = gql`
      {
        homeView {
          section(id: "home-view-section-city-guides") {
            internalID
          }
        }
      }
    `

    it("is hidden when the feature flag is disabled", async () => {
      mockIsFeatureFlagEnabled.mockReturnValue(false)

      await expect(runQuery(query, {})).rejects.toThrow(
        "Section is not displayable: home-view-section-city-guides"
      )
    })

    it("is hidden for Eigen below 9.23.0", async () => {
      await expect(
        runQuery(query, { userAgent: "Artsy-Mobile/9.22.0 Eigen/9.22.0" })
      ).rejects.toThrow("Section is not displayable")
    })

    it("is displayed for Eigen 9.23.0 with the feature flag enabled", async () => {
      const { homeView } = await runQuery(query, {
        userAgent: "Artsy-Mobile/9.23.0 Eigen/9.23.0",
      })

      expect(homeView.section.internalID).toEqual(
        "home-view-section-city-guides"
      )
    })
  })

  it("returns the section's metadata", async () => {
    const query = gql`
      {
        homeView {
          section(id: "home-view-section-city-guides") {
            __typename
            internalID
            contextModule
            component {
              title
              description
              behaviors {
                viewAll {
                  buttonText
                  href
                }
              }
            }
          }
        }
      }
    `

    const { homeView } = await runQuery(query, {})

    expect(homeView.section).toMatchInlineSnapshot(`
      {
        "__typename": "HomeViewSectionCityGuides",
        "component": {
          "behaviors": {
            "viewAll": {
              "buttonText": "City Guide",
              "href": "/city-guide",
            },
          },
          "description": "Then create your own way to experience it",
          "title": "Discover the art that makes your city special",
        },
        "contextModule": "cityGuideCard",
        "internalID": "home-view-section-city-guides",
      }
    `)
  })

  it("returns a card per city followed by the near-me card", async () => {
    const loaders = buildLoaders()

    const { homeView } = await runQuery(cardsQuery, {
      unauthenticatedLoaders: loaders,
    })

    const nodes = homeView.section.cardsConnection.edges.map((e) => e.node)

    expect(nodes.map((n) => n.citySlug)).toEqual([
      ...HOME_VIEW_CITY_GUIDE_SLUGS,
      null,
    ])

    expect(nodes[0]).toEqual({
      citySlug: "london-united-kingdom",
      title: "London",
      href: "/city-guide?citySlug=london-united-kingdom",
      chips: ["6 Curated Guides", "89 Shows"],
    })

    // No guides drops the chip; more than 100 shows is capped
    expect(nodes[1].chips).toEqual(["100+ Shows"])

    expect(nodes[nodes.length - 1]).toEqual({
      citySlug: null,
      title: "Explore city near me",
      href: "/city-guide",
      chips: [],
    })
  })

  it("fetches only counts, with a fixed number of calls per city", async () => {
    const loaders = buildLoaders()

    await runQuery(cardsQuery, { unauthenticatedLoaders: loaders })

    const cityCount = HOME_VIEW_CITY_GUIDE_SLUGS.length
    expect(loaders.showsWithHeadersLoader).toHaveBeenCalledTimes(cityCount * 2)
    expect(loaders.itinerariesLoader).toHaveBeenCalledTimes(cityCount)

    expect(loaders.showsWithHeadersLoader).toHaveBeenCalledWith(
      expect.objectContaining({
        near: "51.51,-0.13",
        status: "upcoming",
        day_threshold: 14,
        at_a_fair: false,
        include_local_discovery: false,
        size: 1,
        total_count: true,
      })
    )
    expect(loaders.itinerariesLoader).toHaveBeenCalledWith({
      city_slug: "london-united-kingdom",
      is_curated: true,
      size: 1,
      total_count: true,
    })
  })

  it("drops a city's chips when its counts fail, without failing the rail", async () => {
    const loaders = buildLoaders()
    loaders.showsWithHeadersLoader.mockImplementation(({ near }) =>
      near === "51.51,-0.13"
        ? Promise.reject(new Error("boom"))
        : withTotalCount(10)
    )
    loaders.itinerariesLoader.mockImplementation(({ city_slug }) =>
      city_slug === "london-united-kingdom"
        ? Promise.reject(new Error("boom"))
        : withTotalCount(1)
    )

    const { homeView } = await runQuery(cardsQuery, {
      unauthenticatedLoaders: loaders,
    })

    const [london, newYork] = homeView.section.cardsConnection.edges.map(
      (e) => e.node
    )

    expect(london.chips).toEqual([])
    expect(newYork.chips).toEqual(["1 Curated Guide", "20 Shows"])
  })

  describe("countLabel", () => {
    it("formats counts", () => {
      expect(countLabel(0, "Show", "Shows")).toBeNull()
      expect(countLabel(null, "Show", "Shows")).toBeNull()
      expect(countLabel(1, "Show", "Shows")).toBe("1 Show")
      expect(countLabel(100, "Show", "Shows")).toBe("100 Shows")
      expect(countLabel(101, "Show", "Shows")).toBe("100+ Shows")
    })
  })
})
