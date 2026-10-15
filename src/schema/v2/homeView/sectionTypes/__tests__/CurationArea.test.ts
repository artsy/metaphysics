import { ResolverContext } from "types/graphql"
import { HomeViewCurationAreaSectionType } from "../CurationArea"
import { CurationArea } from "../../sections/CurationArea"
import { CuratorsPicksEmerging } from "../../sections/CuratorsPicksEmerging"
import { RecommendedArtists } from "../../sections/RecommendedArtists"
import { TrendingArtists } from "../../sections/TrendingArtists"

describe("HomeViewSectionCurationArea", () => {
  const info = {} as any

  describe("rails resolver", () => {
    const resolve = HomeViewCurationAreaSectionType.getFields().rails
      .resolve! as any

    it("resolves each referenced rail section with its title override", () => {
      const result = resolve(
        {
          rails: [
            { sectionID: CuratorsPicksEmerging.id },
            { sectionID: RecommendedArtists.id, title: "Featured Artists" },
          ],
        },
        {},
        // authenticated so the auth-gated RecommendedArtists rail survives
        { accessToken: "a-token" } as ResolverContext,
        info
      )
      expect(result).toEqual([
        { title: undefined, section: CuratorsPicksEmerging },
        { title: "Featured Artists", section: RecommendedArtists },
      ])
    })

    it("drops non-displayable rails", () => {
      // RecommendedArtists requires auth; an unauthenticated context drops it.
      const result = resolve(
        { rails: [{ sectionID: RecommendedArtists.id }] },
        {},
        {} as ResolverContext,
        info
      )
      expect(result).toEqual([])
    })

    it("returns [] when no rails are referenced", () => {
      expect(resolve({}, {}, {} as ResolverContext, info)).toEqual([])
    })
  })

  describe("chips (section resolver)", () => {
    it("returns artist chips + marketing-collection chips", async () => {
      const context = ({
        marketingCollectionsLoader: jest.fn().mockResolvedValue({
          body: [
            {
              id: "ml",
              slug: "most-loved",
              title: "Most Loved",
              description: "The most-saved works on Artsy.",
              thumbnail: "https://ex.com/most-loved.jpg",
            },
            {
              id: "bci",
              slug: "blue-chip-icons",
              title: "Blue-Chip Icons",
              description: "Works by the market's established names.",
              thumbnail: "https://ex.com/blue-chip-icons.jpg",
            },
          ],
        }),
        // Each collection's top 3 artworks → the 3-image stack.
        filterArtworksLoader: jest.fn(({ marketing_collection_id }) => {
          const tag = marketing_collection_id === "most-loved" ? "ml" : "bci"
          return Promise.resolve({
            hits: [1, 2, 3].map((i) => ({
              images: [{ image_url: `https://ex.com/${tag}-${i}.jpg` }],
            })),
          })
        }),
      } as unknown) as ResolverContext

      const resolve = CurationArea.resolver! as any
      const connection = await resolve(CurationArea, {}, context, info)
      const chips = connection.edges.map((e) => e.node)

      expect(chips).toEqual([
        {
          title: "Recommended Artists",
          subtitle:
            "Explore a curated selection of the most exciting artists working today.",
          href: `home-view/sections/${RecommendedArtists.id}?sectionType=${RecommendedArtists.type}`,
          entityType: "HomeViewSection",
          entityID: RecommendedArtists.id,
        },
        {
          title: "Trending Artists",
          subtitle: "See the works boundary pushing artists are creating.",
          href: `home-view/sections/${TrendingArtists.id}?sectionType=${TrendingArtists.type}`,
          entityType: "HomeViewSection",
          entityID: TrendingArtists.id,
        },
        {
          title: "Most Loved",
          subtitle: "The most-saved works on Artsy.",
          href: "/collection/most-loved",
          imageURLs: [
            "https://ex.com/ml-1.jpg",
            "https://ex.com/ml-2.jpg",
            "https://ex.com/ml-3.jpg",
          ],
          entityType: "MarketingCollection",
          entityID: "ml",
        },
        {
          title: "Blue-Chip Icons",
          subtitle: "Works by the market's established names.",
          href: "/collection/blue-chip-icons",
          imageURLs: [
            "https://ex.com/bci-1.jpg",
            "https://ex.com/bci-2.jpg",
            "https://ex.com/bci-3.jpg",
          ],
          entityType: "MarketingCollection",
          entityID: "bci",
        },
      ])
    })
  })
})
