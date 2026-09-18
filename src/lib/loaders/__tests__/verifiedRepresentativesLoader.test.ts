import gravity from "lib/apis/gravity"
import createLoaders from "lib/loaders/loaders_without_authentication/gravity"

jest.mock("lib/apis/gravity", () => jest.fn())

const requestedPath = () => (gravity as jest.Mock).mock.calls[0][0]

describe("verifiedRepresentativesLoader", () => {
  beforeEach(() => {
    ;(gravity as jest.Mock).mockClear()
    ;(gravity as jest.Mock).mockReturnValue(Promise.resolve({ body: [] }))
  })

  it("requests only the artist when no partner is given", async () => {
    const { verifiedRepresentativesLoader } = createLoaders({})

    await verifiedRepresentativesLoader({ artist_id: "artist-123" })

    expect(requestedPath()).toEqual(
      "verified_representatives?artist_id=artist-123?"
    )
  })

  it("requests the artist and partner pair when a partner is given", async () => {
    const { verifiedRepresentativesLoader } = createLoaders({})

    await verifiedRepresentativesLoader({
      artist_id: "artist-123",
      partner_id: "partner-456",
    })

    expect(requestedPath()).toEqual(
      "verified_representatives?artist_id=artist-123&partner_id=partner-456?"
    )
  })

  it("forwards an empty partner id rather than dropping it", async () => {
    const { verifiedRepresentativesLoader } = createLoaders({})

    await verifiedRepresentativesLoader({
      artist_id: "artist-123",
      partner_id: "",
    })

    expect(requestedPath()).toEqual(
      "verified_representatives?artist_id=artist-123&partner_id=?"
    )
  })
})
