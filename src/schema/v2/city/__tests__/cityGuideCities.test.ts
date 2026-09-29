import gql from "lib/gql"
import { runQuery } from "schema/v2/test/utils"
import { CITIES_WITH_GUIDES } from "schema/v2/homeView/sections/citiesWithGuides"

describe("cityGuideCities", () => {
  const query = gql`
    {
      cityGuideCities {
        slug
        name
        coordinates {
          lat
          lng
        }
      }
    }
  `

  it("returns every City Guide city in display order", async () => {
    const { cityGuideCities } = await runQuery(query, {})

    expect(cityGuideCities.map(({ slug }) => slug)).toEqual(
      CITIES_WITH_GUIDES.map(({ slug }) => slug)
    )
  })

  it("returns the slug, name and coordinates of each city", async () => {
    const { cityGuideCities } = await runQuery(query, {})

    expect(cityGuideCities[0]).toEqual({
      slug: "new-york-ny-usa",
      name: "New York",
      coordinates: { lat: 40.71, lng: -74.01 },
    })
  })

  it("includes Venice", async () => {
    const { cityGuideCities } = await runQuery(query, {})

    const venice = CITIES_WITH_GUIDES.find(
      ({ slug }) => slug === "venice-italy"
    )!

    expect(cityGuideCities).toContainEqual({
      slug: "venice-italy",
      name: venice.name,
      coordinates: venice.coordinates,
    })
  })
})
