import gql from "lib/gql"
import { runQuery } from "schema/v2/test/utils"
import { artworksForUser } from "../../artworksForUser"

describe("artworksConnection", () => {
  const query = gql`
    {
      homeView {
        sectionsConnection(first: 1) {
          edges {
            node {
              ... on ArtworksRailHomeViewSection {
                key
                artworksConnection(first: 10) {
                  edges {
                    node {
                      slug
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  `

  const context = {
    authenticatedLoaders: {
      meLoader: jest.fn().mockReturnValue({ type: "User" }),
    },
  }

  describe("when the section is NEW_WORKS_FOR_YOU", () => {
    beforeEach(() => {
      jest.mock("../getSectionsForUser", () => ({
        getSectionsForUser: jest.fn().mockResolvedValue([
          {
            key: "NEW_WORKS_FOR_YOU",
            component: {
              type: "ArtworksRail",
            },
          },
        ]),
      }))
    })

    it("resolves via artworksForUser", async () => {
      artworksForUser.resolve = jest.fn()

      const expectedArgs = {
        maxWorksPerArtist: 3,
        includeBackfill: true,
        first: 10,
        version: "C",
        excludeDislikedArtworks: true,
      }

      await runQuery(query, context)

      const [
        parent,
        args,
      ] = (artworksForUser.resolve as jest.Mock).mock.calls[0]

      expect(parent).toMatchObject({ key: "NEW_WORKS_FOR_YOU" })
      expect(args).toMatchObject(expectedArgs)
    })
  })
})
