import { HomeViewCardType, HomeViewCard } from "../Card"

describe("HomeViewCardType", () => {
  describe("image resolver", () => {
    it("resolves single image from imageURL", () => {
      const card: HomeViewCard = {
        title: "Test Card",
        imageURL: "https://example.com/image.jpg",
      }

      const imageResolver = HomeViewCardType.getFields().image.resolve!
      const result = imageResolver(card, {}, {} as any, {} as any)

      expect(result).toEqual({
        image_url: "https://example.com/image.jpg",
      })
    })

    it("returns undefined when no imageURL is provided", () => {
      const card: HomeViewCard = {
        title: "Test Card",
      }

      const imageResolver = HomeViewCardType.getFields().image.resolve!
      const result = imageResolver(card, {}, {} as any, {} as any)

      expect(result).toBeUndefined()
    })
  })

  describe("images resolver", () => {
    it("resolves single image from imageURL", () => {
      const card: HomeViewCard = {
        title: "Test Card",
        imageURL: "https://example.com/image.jpg",
      }

      const imagesResolver = HomeViewCardType.getFields().images.resolve!
      const result = imagesResolver(card, {}, {} as any, {} as any)

      expect(result).toEqual([
        {
          image_url: "https://example.com/image.jpg",
        },
      ])
    })

    it("resolves multiple images from imageURLs", () => {
      const card: HomeViewCard = {
        title: "Test Card",
        imageURLs: [
          "https://example.com/image1.jpg",
          "https://example.com/image2.jpg",
          "https://example.com/image3.jpg",
        ],
      }

      const imagesResolver = HomeViewCardType.getFields().images.resolve!
      const result = imagesResolver(card, {}, {} as any, {} as any)

      expect(result).toEqual([
        { image_url: "https://example.com/image1.jpg" },
        { image_url: "https://example.com/image2.jpg" },
        { image_url: "https://example.com/image3.jpg" },
      ])
    })

    it("prioritizes imageURL over imageURLs when both are provided", () => {
      const card: HomeViewCard = {
        title: "Test Card",
        imageURL: "https://example.com/single.jpg",
        imageURLs: [
          "https://example.com/multiple1.jpg",
          "https://example.com/multiple2.jpg",
        ],
      }

      const imagesResolver = HomeViewCardType.getFields().images.resolve!
      const result = imagesResolver(card, {}, {} as any, {} as any)

      expect(result).toEqual([
        {
          image_url: "https://example.com/single.jpg",
        },
      ])
    })

    it("returns undefined when no images are provided", () => {
      const card: HomeViewCard = {
        title: "Test Card",
      }

      const imagesResolver = HomeViewCardType.getFields().images.resolve!
      const result = imagesResolver(card, {}, {} as any, {} as any)

      expect(result).toBeUndefined()
    })

    it("handles empty imageURLs array", () => {
      const card: HomeViewCard = {
        title: "Test Card",
        imageURLs: [],
      }

      const imagesResolver = HomeViewCardType.getFields().images.resolve!
      const result = imagesResolver(card, {}, {} as any, {} as any)

      expect(result).toEqual([])
    })
  })

  describe("card field types", () => {
    it("has correct field types", () => {
      const fields = HomeViewCardType.getFields()

      expect(fields.title.type.toString()).toContain("String!")
      expect(fields.subtitle?.type.toString()).toBe("String")
      expect(fields.badgeText?.type.toString()).toBe("String")
      expect(fields.buttonText?.type.toString()).toBe("String")
      expect(fields.href?.type.toString()).toBe("String")
      expect(fields.entityType?.type.toString()).toBe("String")
      expect(fields.entityID?.type.toString()).toBe("String")
      expect(fields.image?.type.toString()).toBe("Image")
      expect(fields.images?.type.toString()).toBe("[Image]")
    })
  })
})
