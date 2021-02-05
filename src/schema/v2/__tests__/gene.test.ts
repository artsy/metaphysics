import { runQuery } from "../test/utils"

describe("gene", () => {
  it("resolves a gene", async () => {
    const result = await runQuery(
      `
        {
          gene(id: "example") {
            name
          }
        }
    `,
      {
        geneLoader: jest
          .fn()
          .mockResolvedValue(
            Promise.resolve({ name: "Representations of Architecture" })
          ),
      }
    )

    expect(result.gene).toEqual({ name: "Representations of Architecture" })
  })

  describe("meta", () => {
    it("returns a description", async () => {
      const result = await runQuery(
        `
          {
            gene(id: "example") {
              name
              meta {
                description
              }
            }
          }
      `,
        {
          geneLoader: jest.fn().mockResolvedValue(
            Promise.resolve({
              name: "Representations of Architecture",
              description:
                "A [category](http://www.example.com) that includes **images of buildings** (in paintings and photographs).",
            })
          ),
        }
      )

      expect(result.gene).toEqual({
        name: "Representations of Architecture",
        meta: {
          description:
            "A category that includes images of buildings (in paintings and photographs).",
        },
      })
    })

    it("returns the special cased meta description", async () => {
      const result = await runQuery(
        `
          {
            gene(id: "latin-america-and-the-caribbean") {
              name
              meta {
                description
              }
            }
          }
      `,
        {
          geneLoader: jest.fn().mockResolvedValue(
            Promise.resolve({
              id: "latin-america-and-the-caribbean",
              name: "Latin America and The Caribbean",
            })
          ),
        }
      )

      expect(result.gene).toEqual({
        name: "Latin America and The Caribbean",
        meta: {
          description:
            "Discover artists from Latin America and the Caribbean from pre-history to present, and browse works by size, price and medium.",
        },
      })
    })

    it("returns the geographic description", async () => {
      const result = await runQuery(
        `
          {
            gene(id: "geographic") {
              meta {
                description
              }
            }
          }
      `,
        {
          geneLoader: jest.fn().mockResolvedValue(
            Promise.resolve({
              id: "the-azores",
              name: "The Azores",
              type: {
                name: "Geographical Regions and Countries",
              },
            })
          ),
        }
      )

      expect(result.gene).toEqual({
        meta: {
          description:
            "Explore art by artists who are from, or who have lived in, The Azores. Browse works by size, price, and medium.",
        },
      })
    })
  })
})
