import gql from "lib/gql"
import { runQuery } from "schema/v2/test/utils"

describe("PrivateViewingRoom", () => {
  const query = gql`
    {
      privateViewingRoom(slug: "some-gallery-for-anna") {
        passwordRequired
        galleryName
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

  it("returns password_required: true without room contents", async () => {
    const context = {
      privateViewingRoomLoader: jest
        .fn()
        .mockResolvedValue({ password_required: true }),
    }

    const result = await runQuery(query, context)

    expect(context.privateViewingRoomLoader).toHaveBeenCalledWith(
      "some-gallery-for-anna"
    )
    expect(result.privateViewingRoom).toEqual({
      passwordRequired: true,
      galleryName: null,
      description: null,
      applyBrand: null,
      brandKit: null,
      artworks: null,
    })
  })

  it("returns room contents when no password is required", async () => {
    const context = {
      privateViewingRoomLoader: jest.fn().mockResolvedValue({
        password_required: false,
        gallery_name: "Isabel Croxatto Galeria",
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
      passwordRequired: false,
      galleryName: "Isabel Croxatto Galeria",
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

  it("coerces a missing password_required to false rather than nulling the whole room", async () => {
    // Regression guard: passwordRequired is Boolean!, so if Gravity's GET
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

    expect(result.privateViewingRoom.passwordRequired).toBe(false)
    expect(result.privateViewingRoom.galleryName).toEqual(
      "Isabel Croxatto Galeria"
    )
  })
})
