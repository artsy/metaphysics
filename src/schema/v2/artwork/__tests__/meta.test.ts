import { runQuery } from "schema/v2/test/utils"
import * as featureFlags from "lib/featureFlags"

jest.mock("lib/featureFlags", () => ({
  getExperimentVariant: jest.fn(),
}))

describe("Meta", () => {
  const artworkData = {
    artists: [
      {
        name: "Hans Hartung",
      },
    ],
    title: "P. 25-1975-H-8",
    date: "1975",
    forsale: true,
    sale_message: "Price on request",
    dimensions: {
      in: "22 4/5 × 30 7/10 in",
      cm: "58 × 78 cm",
    },
    medium: "Acrylic on baryte card",
    metric: "cm",
    partner: {
      name: "Galerie Michel Descours",
    },
  }

  const context = {
    artworkLoader: () => Promise.resolve(artworkData),
  }

  describe("title and description", () => {
    const query = `
      {
        artwork(id:"hans-hartung-p-25-1975-h-8") {
          meta {
            title
            description
          }
        }
      }
    `

    it("includes mention to sale if availability and sale message allow it", async () => {
      const data = await runQuery(query, context as any)

      expect(data).toEqual({
        artwork: {
          meta: {
            title:
              "Hans Hartung | P. 25-1975-H-8 (1975) | Available for Sale | Artsy",
            description:
              "Available for sale from Galerie Michel Descours, Hans Hartung, P. 25-1975-H-8 (1975), Acrylic on baryte card, 58 × 78 cm",
          },
        },
      })
    })

    it("does not include mentions to sale in case of 'Inquire about availability'", async () => {
      artworkData.sale_message = "Inquire about availability"

      const data = await runQuery(query, context as any)

      expect(data).toEqual({
        artwork: {
          meta: {
            title: "Hans Hartung | P. 25-1975-H-8 (1975) | Artsy",
            description:
              "From Galerie Michel Descours, Hans Hartung, P. 25-1975-H-8 (1975), Acrylic on baryte card, 58 × 78 cm",
          },
        },
      })
    })
  })

  describe("#share", () => {
    it("returns properly formatted string", async () => {
      const query = `
        {
          artwork(id:"hans-hartung-p-25-1975-h-8") {
            meta {
              share
            }
          }
        }
      `

      const data = await runQuery(query, context as any)

      expect(data).toEqual({
        artwork: {
          meta: {
            share:
              "Check out Hans Hartung, P. 25-1975-H-8 (1975), From Galerie Michel Descours",
          },
        },
      })
    })
  })

  describe("title experiment", () => {
    beforeEach(() => {
      artworkData.sale_message = "Price on request"
    })

    const query = `
      {
        artwork(id:"hans-hartung-p-25-1975-h-8") {
          meta {
            title
          }
        }
      }
    `

    test("control renders current title", async () => {
      jest.mocked(featureFlags.getExperimentVariant).mockReturnValue({
        enabled: true,
        name: "control",
      } as any)

      const data = await runQuery(query, context as any)

      expect(data.artwork.meta.title).toBe(
        "Hans Hartung | P. 25-1975-H-8 (1975) | Available for Sale | Artsy"
      )
    })

    describe("variant-a", () => {
      beforeEach(() => {
        jest.mocked(featureFlags.getExperimentVariant).mockReturnValue({
          enabled: true,
          name: "variant-a",
        } as any)
      })

      it("changes order and shortens availability", async () => {
        const data = await runQuery(query, context as any)

        expect(data.artwork.meta.title).toBe(
          "P. 25-1975-H-8 (1975) by Hans Hartung - For Sale | Artsy"
        )
      })

      describe("with a non for-sale work", () => {
        const context = {
          artworkLoader: () =>
            Promise.resolve({ ...artworkData, forsale: false }),
        }

        it("omits availability", async () => {
          const data = await runQuery(query, context as any)

          expect(data.artwork.meta.title).toBe(
            "P. 25-1975-H-8 (1975) by Hans Hartung | Artsy"
          )
        })
      })

      describe("with a null title", () => {
        const context = {
          artworkLoader: () =>
            Promise.resolve({
              ...artworkData,
              title: null,
            }),
        }

        it("defaults to 'Untitled'", async () => {
          const data = await runQuery(query, context as any)

          expect(data.artwork.meta.title).toBe(
            "Untitled (1975) by Hans Hartung - For Sale | Artsy"
          )
        })
      })

      describe("with a long title", () => {
        const context = {
          artworkLoader: () =>
            Promise.resolve({
              ...artworkData,
              title:
                "This title is very very very very very very very very very long",
            }),
        }

        it("truncates title", async () => {
          const data = await runQuery(query, context as any)

          expect(data.artwork.meta.title).toBe(
            "This title is very very very very very very very ver… (1975) by Hans Hartung - For Sale | Artsy"
          )
        })
      })
    })
  })
})
