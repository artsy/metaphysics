import gql from "lib/gql"
import { runQuery } from "schema/v2/test/utils"
import { QUICK_LINKS } from "../QuickLinks"
import { OwnerType } from "@artsy/cohesion"
import { isFeatureFlagEnabled } from "lib/featureFlags"

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

  describe("when v2 is enabled", () => {
    beforeEach(() => {
      mockIsFeatureFlagEnabled.mockReturnValue(true)
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
  })

  describe("when v2 is not enabled", () => {
    beforeEach(() => {
      mockIsFeatureFlagEnabled.mockReturnValue(false)
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
              "href": "/favorites/saves",
              "icon": "HeartStrokeIcon",
              "ownerType": "saves",
              "title": "Saves",
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
              "title": "Editorial",
            },
            {
              "href": "/collection/statement-pieces",
              "icon": null,
              "ownerType": "collection",
              "title": "Statement Pieces",
            },
            {
              "href": "/collections-by-category/Medium?homeViewSectionId=home-view-section-explore-by-category&entityID=Medium",
              "icon": "ArtworkIcon",
              "ownerType": "collectionsCategory",
              "title": "Medium",
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
  })

  describe("When a quick link specifies a minimum Eigen version", () => {
    const versionedQuickLink = {
      title: "A futuristic feature",
      href: "/futuristic/feature",
      ownerType: "test" as OwnerType,
      minimumEigenVersion: { major: 42, minor: 0, patch: 0 },
    }

    beforeAll(() => QUICK_LINKS.push(versionedQuickLink))
    afterAll(() => QUICK_LINKS.pop())

    describe("When Eigen < minimum version", () => {
      it("does not return the quick link", async () => {
        const { homeView } = await runQuery(query, {
          ...context,
          userAgent:
            "unknown iOS/18.1.1 Artsy-Mobile/9.0.0 Eigen/2024.12.10.06/9.0.0",
        })

        expect(homeView.section.navigationPills).toHaveLength(
          QUICK_LINKS.length - 1
        )

        expect(homeView.section.navigationPills).not.toContainEqual(
          expect.objectContaining({
            title: "A futuristic feature",
            href: "/futuristic/feature",
          })
        )
      })
    })

    describe("When Eigen >= minimum version", () => {
      it("does return the quick link", async () => {
        const { homeView } = await runQuery(query, {
          ...context,
          userAgent:
            "unknown iOS/18.1.1 Artsy-Mobile/42.0.0 Eigen/2024.12.10.06/42.0.0",
        })

        expect(homeView.section.navigationPills).toHaveLength(
          QUICK_LINKS.length
        )

        expect(homeView.section.navigationPills).toContainEqual(
          expect.objectContaining({
            title: "A futuristic feature",
            href: "/futuristic/feature",
          })
        )
      })
    })

    describe("When the request is not from Eigen", () => {
      it("does return the quick link", async () => {
        const { homeView } = await runQuery(query, {
          ...context,
          userAgent: "anything else",
        })

        expect(homeView.section.navigationPills).toHaveLength(
          QUICK_LINKS.length
        )

        expect(homeView.section.navigationPills).toContainEqual(
          expect.objectContaining({
            title: "A futuristic feature",
            href: "/futuristic/feature",
          })
        )
      })
    })
  })
})
