import { ResolverContext } from "types/graphql"
import { HomeViewGroupSectionType } from "../Group"
import { CuratedGroup, artistCardStackURLs } from "../../sections/CuratedGroup"
import { CuratorsPicksEmerging } from "../../sections/CuratorsPicksEmerging"
import { RecommendedArtists } from "../../sections/RecommendedArtists"
import { TrendingArtists } from "../../sections/TrendingArtists"
import config from "config"

describe("artistCardStackURLs", () => {
  it("returns the first 3 artists' cover images from the rail", async () => {
    const section = {
      resolver: async () => ({
        edges: [1, 2, 3, 4].map((i) => ({
          node: { image_url: `https://ex.com/artist-${i}.jpg` },
        })),
      }),
    } as any

    expect(await artistCardStackURLs(section, {}, {}, {})).toEqual([
      "https://ex.com/artist-1.jpg",
      "https://ex.com/artist-2.jpg",
      "https://ex.com/artist-3.jpg",
    ])
  })

  it("skips artists without a cover image", async () => {
    const section = {
      resolver: async () => ({
        edges: [
          { node: { image_url: "https://ex.com/a.jpg" } },
          { node: {} },
          { node: { image_url: "https://ex.com/c.jpg" } },
        ],
      }),
    } as any

    expect(await artistCardStackURLs(section, {}, {}, {})).toEqual([
      "https://ex.com/a.jpg",
      "https://ex.com/c.jpg",
    ])
  })

  it("degrades to [] on resolver failure", async () => {
    const section = {
      resolver: async () => {
        throw new Error("boom")
      },
    } as any
    expect(await artistCardStackURLs(section, {}, {}, {})).toEqual([])
  })
})

describe("HomeViewSectionGroup", () => {
  const info = {} as any

  describe("rails resolver", () => {
    const resolve = HomeViewGroupSectionType.getFields().rails.resolve! as any

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

  describe("cards (section resolver)", () => {
    const buildContext = (accessToken?: string) =>
      (({
        accessToken,
        marketingCollectionsLoader: jest.fn().mockResolvedValue({
          body: [
            {
              id: "ml",
              slug: "most-loved",
              title: "Most Loved",
              description: "The most-saved works on Artsy.",
              thumbnail: "https://ex.com/most-loved.jpg",
              representative_artwork_ids: ["ml-a1", "ml-a2", "ml-a3"],
            },
            {
              id: "bci",
              slug: "blue-chip-icons",
              title: "Blue-Chip Icons",
              description: "Works by the market's established names.",
              thumbnail: "https://ex.com/blue-chip-icons.jpg",
              representative_artwork_ids: ["bci-a1", "bci-a2", "bci-a3"],
            },
          ],
        }),
        // One batched /artworks load resolves every collection's stack ids.
        artworksLoader: jest.fn(({ ids }) =>
          Promise.resolve(
            ids.map((id: string) => ({
              _id: id,
              images: [{ image_url: `https://ex.com/${id}.jpg` }],
            }))
          )
        ),
      } as unknown) as ResolverContext)

    const resolveCards = async (context: ResolverContext) => {
      const cardGroup = CuratedGroup.cardGroups![0]
      const connection = await (cardGroup.resolver as any)(
        cardGroup,
        {},
        context,
        info
      )
      return connection.edges.map((e) => e.node)
    }

    it("returns artist cards + marketing-collection cards (logged in)", async () => {
      const cards = await resolveCards(buildContext("a-token"))

      expect(cards).toEqual([
        {
          title: "Recommended Artists",
          subtitle:
            "Explore a curated selection of the most exciting artists working today.",
          href: `home-view/sections/${RecommendedArtists.id}?sectionType=${RecommendedArtists.type}`,
          entityType: "HomeViewSection",
          entityID: RecommendedArtists.id,
        },
        {
          title: "Curators' Picks",
          href: `home-view/sections/${CuratorsPicksEmerging.id}?sectionType=${CuratorsPicksEmerging.type}`,
          entityType: "HomeViewSection",
          entityID: CuratorsPicksEmerging.id,
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
            "https://ex.com/ml-a1.jpg",
            "https://ex.com/ml-a2.jpg",
            "https://ex.com/ml-a3.jpg",
          ],
          entityType: "MarketingCollection",
          entityID: "ml",
        },
        {
          title: "Blue-Chip Icons",
          subtitle: "Works by the market's established names.",
          href: "/collection/blue-chip-icons",
          imageURLs: [
            "https://ex.com/bci-a1.jpg",
            "https://ex.com/bci-a2.jpg",
            "https://ex.com/bci-a3.jpg",
          ],
          entityType: "MarketingCollection",
          entityID: "bci",
        },
      ])
    })

    it("fetches the collection stack with an explicit size (no pagination)", async () => {
      const context = buildContext("a-token")
      await resolveCards(context)

      // 2 collections x <=CARD_STACK_SIZE ids; size prevents Gravity paging to 10.
      expect(context.artworksLoader as jest.Mock).toHaveBeenCalledWith(
        expect.objectContaining({ size: 6 })
      )
    })

    it("drops cards for sections not displayable to the viewer (logged out)", async () => {
      const cards = await resolveCards(buildContext())

      // RecommendedArtists requires auth, so for a logged-out viewer its card is
      // dropped — otherwise its homeView.section(id) href would throw.
      expect(cards.map((c) => c.title)).toEqual([
        "Curators' Picks",
        "Trending Artists",
        "Most Loved",
        "Blue-Chip Icons",
      ])
    })

    it("does not run auth-gated section resolvers for a logged-out viewer", async () => {
      const resolverSpy = jest.spyOn(RecommendedArtists, "resolver" as any)

      try {
        await resolveCards(buildContext())
        // Filtered out before its images thunk runs, so its resolver never fires.
        expect(resolverSpy).not.toHaveBeenCalled()
      } finally {
        resolverSpy.mockRestore()
      }
    })

    it("still returns the section cards when the collections load fails", async () => {
      const context = ({
        accessToken: "a-token",
        marketingCollectionsLoader: jest
          .fn()
          .mockRejectedValue(new Error("gravity down")),
        artworksLoader: jest.fn(),
      } as unknown) as ResolverContext

      const cards = await resolveCards(context)

      // The collections load rejected, but the section cards survive.
      expect(cards.map((c) => c.title)).toEqual([
        "Recommended Artists",
        "Curators' Picks",
        "Trending Artists",
      ])
    })

    it("still returns the other cards when one section resolver hangs", async () => {
      jest.useFakeTimers()
      const hung = jest
        .spyOn(TrendingArtists, "resolver" as any)
        .mockReturnValue(new Promise(() => undefined))

      try {
        const cardsPromise = resolveCards(buildContext("a-token"))
        // Fire the per-branch timeout (outer budget / 2) so the hung section
        // degrades to [] before the outer timer would null the whole group.
        await jest.advanceTimersByTimeAsync(
          config.HOME_VIEW_RESOLVER_TIMEOUT_MS / 2
        )
        const cards = await cardsPromise

        // Trending still appears (sans images); every other card is intact.
        expect(cards.map((c) => c.title)).toEqual([
          "Recommended Artists",
          "Curators' Picks",
          "Trending Artists",
          "Most Loved",
          "Blue-Chip Icons",
        ])
        const trending = cards.find((c) => c.title === "Trending Artists")
        expect(trending.imageURLs).toBeUndefined()
      } finally {
        hung.mockRestore()
        jest.useRealTimers()
      }
    })
  })
})
