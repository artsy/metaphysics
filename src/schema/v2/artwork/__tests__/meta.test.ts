import { runQuery } from "schema/v2/test/utils"

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

  describe("#description", () => {
    it("returns properly formatted string", async () => {
      const query = `
        {
          artwork(id:"hans-hartung-p-25-1975-h-8") {
            meta {
              description
            }
          }
        }
      `

      const data = await runQuery(query, context as any)

      expect(data).toEqual({
        artwork: {
          meta: {
            description:
              "Available for sale from Galerie Michel Descours, Hans Hartung, P. 25-1975-H-8 (1975), Acrylic on baryte card, 58 × 78 cm",
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
})
