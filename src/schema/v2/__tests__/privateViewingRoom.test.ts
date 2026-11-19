import gql from "lib/gql"
import { runQuery } from "schema/v2/test/utils"

describe("PrivateViewingRoom", () => {
  const query = gql`
    {
      privateViewingRoom(slug: "some-gallery-for-anna") {
        passcodeRequired
        galleryName
        heading
        description
        applyBrand
        brandKit {
          textColor
        }
        artworks {
          artworkID
          artworkTitle
          artistName
        }
      }
    }
  `

  it("returns passcode_required: true without room contents", async () => {
    const context = {
      privateViewingRoomLoader: jest
        .fn()
        .mockResolvedValue({ passcode_required: true }),
    }

    const result = await runQuery(query, context)

    expect(context.privateViewingRoomLoader).toHaveBeenCalledWith(
      "some-gallery-for-anna"
    )
    expect(result.privateViewingRoom).toEqual({
      passcodeRequired: true,
      galleryName: null,
      heading: null,
      description: null,
      applyBrand: null,
      brandKit: null,
      artworks: null,
    })
  })

  it("returns the gallery branding for a gated room so the passcode page can show the logo", async () => {
    const context = {
      privateViewingRoomLoader: jest.fn().mockResolvedValue({
        passcode_required: true,
        gallery_name: "Isabel Croxatto Galeria",
        apply_brand: true,
        brand_kit: { text_color: "#111111" },
      }),
    }

    const result = await runQuery(query, context)

    expect(result.privateViewingRoom).toEqual({
      passcodeRequired: true,
      galleryName: "Isabel Croxatto Galeria",
      heading: null,
      description: null,
      applyBrand: true,
      brandKit: { textColor: "#111111" },
      artworks: null,
    })
  })

  it("returns room contents when no passcode is required", async () => {
    const context = {
      privateViewingRoomLoader: jest.fn().mockResolvedValue({
        passcode_required: false,
        gallery_name: "Isabel Croxatto Galeria",
        heading: "For Anna",
        description: "For Anna",
        apply_brand: true,
        brand_kit: { text_color: "#111111" },
        artworks: [
          {
            artwork_id: "artwork-1",
            artwork_title: "Mountains and Sea",
            artist_name: "Helen Frankenthaler",
          },
        ],
      }),
    }

    const result = await runQuery(query, context)

    expect(result.privateViewingRoom).toEqual({
      passcodeRequired: false,
      galleryName: "Isabel Croxatto Galeria",
      heading: "For Anna",
      description: "For Anna",
      applyBrand: true,
      brandKit: { textColor: "#111111" },
      artworks: [
        {
          artworkID: "artwork-1",
          artworkTitle: "Mountains and Sea",
          artistName: "Helen Frankenthaler",
        },
      ],
    })
  })

  it("omits galleryName when the gallery has chosen to hide it", async () => {
    const context = {
      privateViewingRoomLoader: jest.fn().mockResolvedValue({
        passcode_required: false,
        artworks: [],
      }),
    }

    const result = await runQuery(query, context)

    expect(result.privateViewingRoom.galleryName).toBeNull()
  })

  it("returns null for an unknown or unpublished slug instead of a GraphQL error", async () => {
    const context = {
      privateViewingRoomLoader: jest
        .fn()
        .mockRejectedValue({ statusCode: 404 }),
    }

    const result = await runQuery(query, context)

    expect(result.privateViewingRoom).toBeNull()
  })

  it("re-throws a non-404 error instead of swallowing it", async () => {
    const context = {
      privateViewingRoomLoader: jest
        .fn()
        .mockRejectedValue({ statusCode: 500, message: "Gravity is down" }),
    }

    await expect(runQuery(query, context)).rejects.toThrow()
  })

  it("coerces a missing passcode_required to false rather than nulling the whole room", async () => {
    // Regression guard: passcodeRequired is Boolean!, so if Gravity's GET
    // ever omitted this key on either branch, a bare pass-through would
    // violate the non-null constraint and null out the entire
    // privateViewingRoom field — losing gallery name/artworks along with it.
    const context = {
      privateViewingRoomLoader: jest.fn().mockResolvedValue({
        gallery_name: "Isabel Croxatto Galeria",
        artworks: [],
      }),
    }

    const result = await runQuery(query, context)

    expect(result.privateViewingRoom.passcodeRequired).toBe(false)
    expect(result.privateViewingRoom.galleryName).toEqual(
      "Isabel Croxatto Galeria"
    )
  })

  describe("coverImageURL", () => {
    const coverQuery = gql`
      {
        privateViewingRoom(slug: "some-gallery-for-anna") {
          coverImageURL
        }
      }
    `

    it("returns the cover image from the last publish", async () => {
      const context = {
        privateViewingRoomLoader: jest.fn().mockResolvedValue({
          passcode_required: false,
          cover_image_url: "https://example.com/cover-wide.jpg",
        }),
      }

      const result = await runQuery(coverQuery, context)

      expect(result.privateViewingRoom.coverImageURL).toBe(
        "https://example.com/cover-wide.jpg"
      )
    })

    it("is null without a cover", async () => {
      const context = {
        privateViewingRoomLoader: jest
          .fn()
          .mockResolvedValue({ passcode_required: false }),
      }

      const result = await runQuery(coverQuery, context)

      expect(result.privateViewingRoom.coverImageURL).toBeNull()
    })
  })

  describe("layout", () => {
    const layoutQuery = gql`
      {
        privateViewingRoom(slug: "some-gallery-for-anna") {
          heroStyle
          textAlignment
          artworkLayout
          artworkColumns
        }
      }
    `

    it("returns the layout of a room published with one", async () => {
      const context = {
        privateViewingRoomLoader: jest.fn().mockResolvedValue({
          passcode_required: false,
          hero_style: "full_image",
          text_alignment: "center",
          artwork_layout: "masonry",
          artwork_columns: 4,
        }),
      }

      const result = await runQuery(layoutQuery, context)

      expect(result.privateViewingRoom).toEqual({
        heroStyle: "FULL_IMAGE",
        textAlignment: "CENTER",
        artworkLayout: "MASONRY",
        artworkColumns: 4,
      })
    })

    it("is null on a room published before the rebuild", async () => {
      const context = {
        privateViewingRoomLoader: jest
          .fn()
          .mockResolvedValue({ passcode_required: false }),
      }

      const result = await runQuery(layoutQuery, context)

      expect(result.privateViewingRoom).toEqual({
        heroStyle: null,
        textAlignment: null,
        artworkLayout: null,
        artworkColumns: null,
      })
    })
  })

  describe("curatorialText", () => {
    const curatorialQuery = gql`
      {
        privateViewingRoom(slug: "some-gallery-for-anna") {
          curatorialText
        }
      }
    `

    it("returns the curatorial text, keeping its paragraph breaks", async () => {
      const context = {
        privateViewingRoomLoader: jest.fn().mockResolvedValue({
          passcode_required: false,
          curatorial_text: "First paragraph.\n\nSecond paragraph.",
        }),
      }

      const result = await runQuery(curatorialQuery, context)

      expect(result.privateViewingRoom.curatorialText).toBe(
        "First paragraph.\n\nSecond paragraph."
      )
    })

    it("is null when the gallery added none", async () => {
      const context = {
        privateViewingRoomLoader: jest
          .fn()
          .mockResolvedValue({ passcode_required: false }),
      }

      const result = await runQuery(curatorialQuery, context)

      expect(result.privateViewingRoom.curatorialText).toBeNull()
    })
  })

  describe("showLogo", () => {
    const logoQuery = gql`
      {
        privateViewingRoom(slug: "some-gallery-for-anna") {
          applyBrand
          showLogo
        }
      }
    `

    it("returns the logo setting apart from applying the brand", async () => {
      const context = {
        privateViewingRoomLoader: jest.fn().mockResolvedValue({
          passcode_required: false,
          apply_brand: false,
          show_logo: true,
        }),
      }

      const result = await runQuery(logoQuery, context)

      expect(result.privateViewingRoom).toEqual({
        applyBrand: false,
        showLogo: true,
      })
    })

    it("is null on a room published before the logo had its own setting", async () => {
      const context = {
        privateViewingRoomLoader: jest
          .fn()
          .mockResolvedValue({ passcode_required: false, apply_brand: true }),
      }

      const result = await runQuery(logoQuery, context)

      expect(result.privateViewingRoom.showLogo).toBeNull()
    })
  })
})
