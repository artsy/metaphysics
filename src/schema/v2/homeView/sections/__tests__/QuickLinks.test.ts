import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"
import { isFeatureFlagEnabled } from "lib/featureFlags"

jest.mock("lib/featureFlags", () => ({
  isFeatureFlagEnabled: jest.fn(() => false),
}))

const mockIsFeatureFlagEnabled = isFeatureFlagEnabled as jest.Mock

// Mock the resolver functions - these will be accessed via require() inside QuickLinks resolver
const mockMyBidsResolve = jest.fn()
const mockUserPricePreferenceResolve = jest.fn()

/**
 * Intercept dynamic require() calls in the QuickLinks resolver.
 *
 * This is necessary because the QuickLinks resolver uses dynamic require() calls
 * inside async functions to load dependencies. Jest's standard module mocking
 * doesn't work in this case because:
 * 1. The require() calls happen at runtime inside the resolver
 * 2. Mocking the entire modules breaks GraphQL schema validation
 *
 * This approach allows us to provide mock implementations for just the resolver
 * functions while keeping the GraphQL types intact.
 */
const originalRequire = global.require
const mockedRequire = jest.fn((moduleName: string) => {
  if (moduleName === "schema/v2/me/myBids") {
    return {
      MyBids: {
        resolve: mockMyBidsResolve,
      },
    }
  }
  if (moduleName === "schema/v2/me/userPricePreference") {
    return {
      UserPricePreference: {
        resolve: mockUserPricePreferenceResolve,
      },
    }
  }
  // Fall back to the original require for all other modules
  return originalRequire(moduleName)
})

beforeAll(() => {
  global.require = mockedRequire as any
})

afterAll(() => {
  global.require = originalRequire
})

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

  beforeEach(() => {
    mockIsFeatureFlagEnabled.mockImplementation(() => false)
    // Setup the mock resolver responses
    mockMyBidsResolve.mockResolvedValue({ active: [] })
    mockUserPricePreferenceResolve.mockResolvedValue(null)
  })

  it("returns the section's data", async () => {
    const { homeView } = await runAuthenticatedQuery(query, {})

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
          userAgent: "Artsy-Mobile/8.66.0 Eigen/8.66.0",
        }

        const { homeView } = await runAuthenticatedQuery(
          query,
          contextWithOldEigen
        )

        const discoverDailyLink = homeView.section.navigationPills.find(
          (pill) => pill.title === "Discover Daily"
        )

        expect(discoverDailyLink).toBeUndefined()
      })
    })

    describe("When Eigen >= minimum version", () => {
      it("does return the quick link", async () => {
        const contextWithNewEigen = {
          userAgent: "Artsy-Mobile/8.67.0 Eigen/8.67.0",
        }

        const { homeView } = await runAuthenticatedQuery(
          query,
          contextWithNewEigen
        )

        const discoverDailyLink = homeView.section.navigationPills.find(
          (pill) => pill.title === "Discover Daily"
        )

        expect(discoverDailyLink).toBeDefined()
      })
    })

    describe("When the request is not from Eigen", () => {
      it("does return the quick link", async () => {
        const contextFromWeb = {
          userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ...",
        }

        const { homeView } = await runAuthenticatedQuery(query, contextFromWeb)

        const discoverDailyLink = homeView.section.navigationPills.find(
          (pill) => pill.title === "Discover Daily"
        )

        expect(discoverDailyLink).toBeDefined()
      })
    })
  })
})
