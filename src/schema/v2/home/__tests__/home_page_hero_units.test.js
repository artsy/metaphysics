/* eslint-disable promise/always-return */
import { runQuery } from "schema/v2/test/utils"

describe("HomePageHeroUnits", () => {
  const payload = [
    {
      _id: "57e2ec9b8b3b817dc10015f7",
      id: "artrio-2016-number-3",
      link: "/artrio-2016",
      heading: "Featured Fair",
      name: "ArtRio 2016",
      mobile_title: "Mobile ArtRio 2016",
      app_title: "App ArtRio 2016",
      background_image_url: "wide.jpg",
      background_image_mobile_url: "narrow.jpg",
      background_image_app_phone_url: "app-narrow.jpg",
      background_image_app_tablet_url: "app-wide.jpg",
      description: "Discover works on your laptop",
      mobile_description: "Discover works on your phone",
      app_description: "Discover works in the artsy app",
    },
  ]
  ;[("martsy", "desktop")].forEach((platform) => {
    it(`picks subtitle for ${platform}`, () => {
      const params = { enabled: true }
      params[platform] = true
      const context = {
        siteHeroUnitsLoader: sinon
          .stub()
          .withArgs("site_hero_units", params)
          .returns(Promise.resolve(payload)),
      }

      const query = `
        {
          homePage {
            heroUnits(platform: ${platform.toUpperCase()}) {
              subtitle
            }
          }
        }
      `

      return runQuery(query, context).then(({ homePage: { heroUnits } }) => {
        if (platform === "desktop") {
          expect(heroUnits[0].subtitle).toEqual("Discover works on your laptop")
        } else {
          expect(heroUnits[0].subtitle).toEqual("Discover works on your phone")
        }
      })
    })

    it(`returns enabled hero units for ${platform} only`, () => {
      const params = { enabled: true }
      params[platform] = true
      const context = {
        siteHeroUnitsLoader: sinon
          .stub()
          .withArgs("site_hero_units", params)
          .returns(Promise.resolve(payload)),
      }

      const query = `
        {
          homePage {
            heroUnits(platform: ${platform.toUpperCase()}) {
              internalID
              slug
              href
              heading
              title
              backgroundImageURL
            }
          }
        }
      `

      return runQuery(query, context).then(({ homePage: { heroUnits } }) => {
        expect(heroUnits).toEqual([
          {
            internalID: "57e2ec9b8b3b817dc10015f7",
            slug: "artrio-2016-number-3",
            href: "/artrio-2016",
            heading: "Featured Fair",
            title: "ArtRio 2016",
            backgroundImageURL:
              platform === "desktop" ? "wide.jpg" : "narrow.jpg",
          },
        ])
      })
    })
  })

  it("returns a specific background image version", () => {
    const context = {
      siteHeroUnitsLoader: sinon.stub().returns(Promise.resolve(payload)),
    }

    const query = `
      {
        homePage {
          heroUnits(platform: MARTSY) {
            backgroundImageURL(version: WIDE)
          }
        }
      }
    `

    return runQuery(query, context).then(({ homePage: { heroUnits } }) => {
      expect(heroUnits).toEqual([
        {
          backgroundImageURL: "wide.jpg",
        },
      ])
    })
  })

  it("returns the correct wide image on 'mobile'", async () => {
    const context = {
      siteHeroUnitsLoader: sinon.stub().returns(Promise.resolve(payload)),
    }

    const backgroundImageWideResult = await runQuery(
      `
      {
        homePage {
          heroUnits(platform: MOBILE) {
            backgroundImageURL(version: WIDE)
          }
        }
      }
    `,
      context
    )

    expect(
      backgroundImageWideResult.homePage.heroUnits[0].backgroundImageURL
    ).toBe("app-wide.jpg")
  })

  it("returns the correct narrow image on 'mobile'", async () => {
    const context = {
      siteHeroUnitsLoader: sinon.stub().returns(Promise.resolve(payload)),
    }

    const backgroundImageNarrowResult = await runQuery(
      `
      {
        homePage {
          heroUnits(platform: MOBILE) {
            backgroundImageURL(version: NARROW)
          }
        }
      }
    `,
      context
    )

    expect(
      backgroundImageNarrowResult.homePage.heroUnits[0].backgroundImageURL
    ).toBe("app-narrow.jpg")
  })
  it("returns the correct title and subtitle on 'mobile'", async () => {
    const context = {
      siteHeroUnitsLoader: sinon.stub().returns(Promise.resolve(payload)),
    }

    const result = await runQuery(
      `
      {
        homePage {
          heroUnits(platform: MOBILE) {
            title
            subtitle
          }
        }
      }
    `,
      context
    )

    expect(result.homePage.heroUnits[0]).toEqual({
      title: "App ArtRio 2016",
      subtitle: "Discover works in the artsy app",
    })
  })
})
