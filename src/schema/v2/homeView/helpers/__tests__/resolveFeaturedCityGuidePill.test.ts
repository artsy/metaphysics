import moment from "moment"
import { resolveFeaturedCityGuidePill } from "../resolveFeaturedCityGuidePill"
import { FeaturedCityGuide } from "../../sections/featuredCityGuides"
import { CityWithGuide } from "../../sections/citiesWithGuides"

jest.mock("config", () => ({
  ENABLE_IP_BASED_LOCATION: true,
}))

const LONDON = { lat: 51.5072, lng: -0.1276 }
const NEW_YORK = { lat: 40.7128, lng: -74.006 }

const londonGuide: FeaturedCityGuide = {
  citySlug: "london-united-kingdom",
  title: "London Art Week",
  href: "/city-guide?citySlug=london-united-kingdom",
  displayStartAt: moment.utc().subtract(1, "day").toISOString(),
  displayEndAt: moment.utc().add(1, "day").toISOString(),
}

const newYorkGuide: FeaturedCityGuide = {
  citySlug: "new-york-ny-usa",
  title: "New York Art Week",
  href: "/city-guide?citySlug=new-york-ny-usa",
  displayStartAt: moment.utc().subtract(1, "day").toISOString(),
  displayEndAt: moment.utc().add(1, "day").toISOString(),
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
  it("returns a featured pill when the viewer is near an active guide's city", async () => {
    const context = buildContext() as any

    const pill = await resolveFeaturedCityGuidePill(
      context,
      [londonGuide],
      citiesWithGuidesFixture
    )

    expect(pill).toMatchObject({
      title: "London Art Week",
      href: "/city-guide?citySlug=london-united-kingdom",
      isFeatured: true,
    })
  })

  it("picks the nearest active guide, not the first one in the array", async () => {
    const context = buildContext({
      requestLocationLoader: jest.fn().mockResolvedValue({
        body: {
          data: {
            location: { latitude: NEW_YORK.lat, longitude: NEW_YORK.lng },
          },
        },
      }),
    }) as any

    // londonGuide is listed first, but the viewer is near New York
    const pill = await resolveFeaturedCityGuidePill(
      context,
      [londonGuide, newYorkGuide],
      citiesWithGuidesFixture
    )

    expect(pill).toMatchObject({
      title: "New York Art Week",
      href: "/city-guide?citySlug=new-york-ny-usa",
      isFeatured: true,
    })
  })

  it("returns a default pill when the viewer is far from the active guide's city", async () => {
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
      [londonGuide],
      citiesWithGuidesFixture
    )

    expect(pill).toMatchObject({
      isFeatured: false,
      href: "/city-guide?citySlug=new-york-ny-usa",
    })
  })

  it("returns a default pill when the active guide's city isn't in the candidate list", async () => {
    const context = buildContext() as any

    const pill = await resolveFeaturedCityGuidePill(context, [londonGuide], [])

    expect(pill).toMatchObject({ isFeatured: false, href: "/city-guide" })
  })

  it("returns a default pill with a nearby city slug when no guide is active", async () => {
    const inactiveGuide: FeaturedCityGuide = {
      ...londonGuide,
      displayStartAt: moment.utc().subtract(2, "days").toISOString(),
      displayEndAt: moment.utc().subtract(1, "day").toISOString(),
    }

    const context = buildContext() as any

    const pill = await resolveFeaturedCityGuidePill(
      context,
      [inactiveGuide],
      citiesWithGuidesFixture
    )

    expect(pill).toMatchObject({
      isFeatured: false,
      href: "/city-guide?citySlug=london-united-kingdom",
    })
  })

  it("falls back to a default pill without crashing when the location loader rejects", async () => {
    const context = buildContext({
      requestLocationLoader: jest.fn().mockRejectedValue(new Error("boom")),
    }) as any

    const pill = await resolveFeaturedCityGuidePill(context, [londonGuide], [])

    expect(pill).toMatchObject({ isFeatured: false, href: "/city-guide" })
  })

  it("returns a default pill when there are no active guides configured", async () => {
    const context = buildContext() as any

    const pill = await resolveFeaturedCityGuidePill(context, [], [])

    expect(pill).toMatchObject({ isFeatured: false, href: "/city-guide" })
  })
})
