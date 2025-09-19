import gql from "lib/gql"
import { runQuery } from "schema/v2/test/utils"
import { isFeatureFlagEnabled } from "lib/featureFlags"

jest.mock("lib/featureFlags", () => ({
  isFeatureFlagEnabled: jest.fn(() => false),
}))

const mockIsFeatureFlagEnabled = isFeatureFlagEnabled as jest.Mock

describe("QuickLinks", () => {
  const query = gql`
    {
      homeView {
        section(id: "home-view-section-quick-links") {
          __typename
          internalID
          contextModule
          ownerType
          ... on HomeViewSectionNavigationPills {
            navigationPills {
              title
              icon
              href
              ownerType
            }
          }
        }
      }
    }
  `

  const context = {
    accessToken: "424242",
  }

  beforeEach(() => {
    mockIsFeatureFlagEnabled.mockImplementation(() => false)
  })

  it("returns the section's data", async () => {
    const { homeView } = await runQuery(query, context)

    expect(homeView.section).toMatchInlineSnapshot(`
      {
        "__typename": "HomeViewSectionNavigationPills",
        "contextModule": "quickLinks",
        "internalID": "home-view-section-quick-links",
        "navigationPills": [
          {
            "href": "/infinite-discovery",
            "icon": "ImageSetIcon",
            "ownerType": "infiniteDiscovery",
            "title": "Discover Daily",
          },
          {
            "href": "/auctions",
            "icon": "GavelIcon",
            "ownerType": "auctions",
            "title": "Auctions",
          },
          {
            "href": "/collection/new-this-week",
            "icon": null,
            "ownerType": "collection",
            "title": "New This Week",
          },
          {
            "href": "/articles",
            "icon": "PublicationIcon",
            "ownerType": "articles",
            "title": "Articles",
          },
          {
            "href": "/collection/statement-pieces",
            "icon": null,
            "ownerType": "collection",
            "title": "Statement Pieces",
          },
          {
            "href": "/collection/paintings",
            "icon": "ArtworkIcon",
            "ownerType": "collection",
            "title": "Paintings",
          },
          {
            "href": "galleries-for-you",
            "icon": "InstitutionIcon",
            "ownerType": "galleriesForYou",
            "title": "Galleries for You",
          },
          {
            "href": "/shows-for-you",
            "icon": null,
            "ownerType": "shows",
            "title": "Shows for You",
          },
          {
            "href": "/featured-fairs",
            "icon": "FairIcon",
            "ownerType": "featuredFairs",
            "title": "Featured Fairs",
          },
        ],
        "ownerType": "quickLinks",
      }
    `)
  })

  describe("When a quick link specifies a minimum Eigen version", () => {
    describe("When Eigen < minimum version", () => {
      it("does not return the quick link", async () => {
        const contextWithOldEigen = {
          ...context,
          userAgent: "Artsy-Mobile/8.66.0 Eigen/8.66.0",
        }

        const { homeView } = await runQuery(query, contextWithOldEigen)

        const discoverDailyLink = homeView.section.navigationPills.find(
          (pill) => pill.title === "Discover Daily"
        )

        expect(discoverDailyLink).toBeUndefined()
      })
    })

    describe("When Eigen >= minimum version", () => {
      it("does return the quick link", async () => {
        const contextWithNewEigen = {
          ...context,
          userAgent: "Artsy-Mobile/8.67.0 Eigen/8.67.0",
        }

        const { homeView } = await runQuery(query, contextWithNewEigen)

        const discoverDailyLink = homeView.section.navigationPills.find(
          (pill) => pill.title === "Discover Daily"
        )

        expect(discoverDailyLink).toBeDefined()
      })
    })

    describe("When the request is not from Eigen", () => {
      it("does return the quick link", async () => {
        const contextFromWeb = {
          ...context,
          userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ...",
        }

        const { homeView } = await runQuery(query, contextFromWeb)

        const discoverDailyLink = homeView.section.navigationPills.find(
          (pill) => pill.title === "Discover Daily"
        )

        expect(discoverDailyLink).toBeDefined()
      })
    })
  })
})