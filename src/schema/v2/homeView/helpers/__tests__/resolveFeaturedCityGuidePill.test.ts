import moment from "moment"
import { resolveFeaturedCityGuidePill } from "../resolveFeaturedCityGuidePill"
import { FeaturedCityGuide } from "../../sections/featuredCityGuides"
import { CityWithGuide } from "../../sections/citiesWithGuides"

jest.mock("config", () => ({
  ENABLE_IP_BASED_LOCATION: true,
}))

const LONDON = { lat: 51.5072, lng: -0.1276 }
const NEW_YORK = { lat: 40.7128, lng: -74.006 }

const activeGuide: FeaturedCityGuide = {
  citySlug: "london-united-kingdom",
  displayStartAt: moment.utc().subtract(1, "day").toISOString(),
  displayEndAt: moment.utc().add(1, "day").toISOString(),
  pill: { title: "London Art Week" },
  heroUnit: {
    id: "london-art-week",
    title: "Your Guide to London Art Week",
    body: "All the art highlights",
    ctaText: "Explore Now",
    image: { url: "https://example.com/london.png", width: 2880, height: 1200 },
  },
}

const citiesWithGuidesFixture: CityWithGuide[] = [
  {
    slug: "london-united-kingdom",
    name: "London",
    coordinates: LONDON,
    maxBounds: { sw: LONDON, ne: LONDON },
  },
  {
    slug: "new-york-ny-usa",
    name: "New York",
    coordinates: NEW_YORK,
    maxBounds: { sw: NEW_YORK, ne: NEW_YORK },
  },
]

const buildContext = (overrides: Record<string, any> = {}) => ({
  ipAddress: "1.2.3.4",
  requestLocationLoader: jest.fn().mockResolvedValue({
    body: {
      data: {
        location: { latitude: LONDON.lat, longitude: LONDON.lng },
      },
    },
  }),
  ...overrides,
})

describe("resolveFeaturedCityGuidePill", () => {
  describe("while the guide is active", () => {
    it("returns the featured pill", async () => {
      const context = buildContext() as any

      const pill = await resolveFeaturedCityGuidePill(
        context,
        activeGuide,
        citiesWithGuidesFixture
      )

      expect(pill).toMatchObject({
        title: "London Art Week",
        href: "/city-guide?citySlug=london-united-kingdom",
        isFeatured: true,
      })
    })

    it("returns the featured pill to a viewer far from the guide's city", async () => {
      const context = buildContext({
        requestLocationLoader: jest.fn().mockResolvedValue({
          body: {
            data: {
              location: { latitude: NEW_YORK.lat, longitude: NEW_YORK.lng },
            },
          },
        }),
      }) as any

      const pill = await resolveFeaturedCityGuidePill(
        context,
        activeGuide,
        citiesWithGuidesFixture
      )

      expect(pill).toMatchObject({
        href: "/city-guide?citySlug=london-united-kingdom",
        isFeatured: true,
      })
    })

    it("returns the featured pill when the viewer's location is unknown", async () => {
      const context = buildContext({ ipAddress: undefined }) as any

      const pill = await resolveFeaturedCityGuidePill(
        context,
        activeGuide,
        citiesWithGuidesFixture
      )

      expect(pill).toMatchObject({ isFeatured: true })
    })

    it("does not look up the viewer's location", async () => {
      const context = buildContext() as any

      await resolveFeaturedCityGuidePill(
        context,
        activeGuide,
        citiesWithGuidesFixture
      )

      expect(context.requestLocationLoader).not.toHaveBeenCalled()
    })
  })

  describe("outside the guide's window", () => {
    const upcomingGuide: FeaturedCityGuide = {
      ...activeGuide,
      displayStartAt: moment.utc().add(1, "day").toISOString(),
      displayEndAt: moment.utc().add(2, "days").toISOString(),
    }
    const endedGuide: FeaturedCityGuide = {
      ...activeGuide,
      displayStartAt: moment.utc().subtract(2, "days").toISOString(),
      displayEndAt: moment.utc().subtract(1, "day").toISOString(),
    }

    it.each([
      ["before it starts", upcomingGuide],
      ["after it ends", endedGuide],
    ])(
      "returns a default pill with a nearby city slug %s",
      async (_label, guide) => {
        const context = buildContext() as any

        const pill = await resolveFeaturedCityGuidePill(
          context,
          guide,
          citiesWithGuidesFixture
        )

        expect(pill).toMatchObject({
          title: "City Guide",
          isFeatured: false,
          href: "/city-guide?citySlug=london-united-kingdom",
        })
      }
    )

    it("returns a bare /city-guide link when no city is near the viewer", async () => {
      const context = buildContext() as any

      const pill = await resolveFeaturedCityGuidePill(context, endedGuide, [])

      expect(pill).toMatchObject({ isFeatured: false, href: "/city-guide" })
    })

    it("falls back to a default pill without crashing when the location loader rejects", async () => {
      const context = buildContext({
        requestLocationLoader: jest.fn().mockRejectedValue(new Error("boom")),
      }) as any

      const pill = await resolveFeaturedCityGuidePill(
        context,
        endedGuide,
        citiesWithGuidesFixture
      )

      expect(pill).toMatchObject({ isFeatured: false, href: "/city-guide" })
    })
  })
})
