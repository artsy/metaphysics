import { ResolverContext } from "types/graphql"
import { HomeViewCurationAreaSectionType } from "../CurationArea"
import { CurationArea } from "../../sections/CurationArea"
import { CuratorsPicksEmerging } from "../../sections/CuratorsPicksEmerging"
import { RecommendedArtists } from "../../sections/RecommendedArtists"
import { TrendingArtists } from "../../sections/TrendingArtists"

describe("HomeViewSectionCurationArea", () => {
  const info = {} as any

  describe("leadSection resolver", () => {
    const resolve = HomeViewCurationAreaSectionType.getFields().leadSection
      .resolve! as any

    it("resolves the referenced lead section from the registry", () => {
      const result = resolve(
        { leadSectionID: CuratorsPicksEmerging.id },
        {},
        {} as ResolverContext,
        info
      )
      expect(result.id).toEqual(CuratorsPicksEmerging.id)
    })

    it("returns null when no lead section is referenced", () => {
      const result = resolve({}, {}, {} as ResolverContext, info)
      expect(result).toBeNull()
    })
  })

  describe("chips (section resolver)", () => {
    it("returns a chip per curation area with its target", async () => {
      const resolve = CurationArea.resolver! as any
      const connection = await resolve(
        CurationArea,
        {},
        {} as ResolverContext,
        info
      )
      const chips = connection.edges.map((e) => e.node)

      expect(chips).toEqual([
        {
          title: "Recommended Artists",
          href: `home-view/sections/${RecommendedArtists.id}?sectionType=${RecommendedArtists.type}`,
          entityType: "HomeViewSection",
          entityID: RecommendedArtists.id,
        },
        {
          title: "Trending Artists",
          href: `home-view/sections/${TrendingArtists.id}?sectionType=${TrendingArtists.type}`,
          entityType: "HomeViewSection",
          entityID: TrendingArtists.id,
        },
        { title: "Collections", href: "/collections" },
      ])
    })
  })
})
