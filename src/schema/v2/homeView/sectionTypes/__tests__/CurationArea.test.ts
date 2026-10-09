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
