import { runQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

describe("CollectorProfile collectedArtistsConnection", () => {
  const mockCollectedArtists = [
    {
      artist: {
        id: "artist-1",
        _id: "artist-internal-1",
        name: "Artist One",
      },
      representative_category: "Painting",
    },
    {
      artist: {
        id: "artist-2",
        _id: "artist-internal-2",
        name: "Artist Two",
      },
      representative_category: "Drawing, Collage or other Work on Paper",
    },
    {
      artist: {
        id: "artist-3",
        _id: "artist-internal-3",
        name: "Artist Three",
      },
      representative_category: "Video/Film/Animation",
    },
  ]

  const partnerCollectorProfileCollectedArtistsLoader = jest.fn(() =>
    Promise.resolve({
      body: mockCollectedArtists,
      headers: { "x-total-count": "3" },
    })
  )

  const context = {
    partnerCollectorProfileCollectedArtistsLoader,
  }

  afterEach(() => {
    partnerCollectorProfileCollectedArtistsLoader.mockClear()
  })

  describe("with artworkID argument", () => {
    const query = gql`
      query {
        collectorProfile(userID: "user-123") {
          collectedArtistsConnection(first: 10, artworkID: "artwork-456") {
            totalCount
            edges {
              node {
                name
                internalID
              }
              representativeCategory
            }
          }
        }
      }
    `

    it("returns collected artists with mapped category names", async () => {
      const collectorProfilesLoader = jest.fn(() =>
        Promise.resolve({
          body: [{ id: "collector-profile-123", name: "Test Collector" }],
          headers: {},
        })
      )

      const result = await runQuery(query, {
        ...context,
        collectorProfilesLoader,
      })

      const connection = result.collectorProfile.collectedArtistsConnection

      expect(connection.totalCount).toBe(3)
      expect(connection.edges).toHaveLength(3)
      expect(connection.edges[0].node.name).toBe("Artist One")
      expect(connection.edges[0].representativeCategory).toBe("Painting")
      expect(connection.edges[1].representativeCategory).toBe("Works on Paper")
      expect(connection.edges[2].representativeCategory).toBe("Moving Image")
    })

    it("calls loader with correct parameters", async () => {
      const collectorProfilesLoader = jest.fn(() =>
        Promise.resolve({
          body: [{ id: "collector-profile-123", name: "Test Collector" }],
          headers: {},
        })
      )

      await runQuery(query, {
        ...context,
        collectorProfilesLoader,
      })

      expect(
        partnerCollectorProfileCollectedArtistsLoader
      ).toHaveBeenCalledWith("collector-profile-123", {
        artwork_id: "artwork-456",
        page: 1,
        size: 10,
        total_count: true,
      })
    })
  })

  describe("with injected artworkID from context", () => {
    const query = gql`
      query {
        collectorProfile(userID: "user-123") {
          collectedArtistsConnection(first: 5) {
            totalCount
            edges {
              node {
                name
              }
              representativeCategory
            }
          }
        }
      }
    `

    it("uses injected artworkID from conversation context", async () => {
      const collectorProfilesLoader = jest.fn(() =>
        Promise.resolve({
          body: [
            {
              id: "collector-profile-123",
              name: "Test Collector",
              artworkID: "injected-artwork-789",
            },
          ],
          headers: {},
        })
      )

      await runQuery(query, {
        ...context,
        collectorProfilesLoader,
      })

      expect(
        partnerCollectorProfileCollectedArtistsLoader
      ).toHaveBeenCalledWith("collector-profile-123", {
        artwork_id: "injected-artwork-789",
        page: 1,
        size: 5,
        total_count: true,
      })
    })
  })

  describe("without artworkID", () => {
    const query = gql`
      query {
        collectorProfile(userID: "user-123") {
          collectedArtistsConnection(first: 5) {
            totalCount
          }
        }
      }
    `

    it("throws error when artworkID is not provided", async () => {
      const collectorProfilesLoader = jest.fn(() =>
        Promise.resolve({
          body: [{ id: "collector-profile-123", name: "Test Collector" }],
          headers: {},
        })
      )

      await expect(
        runQuery(query, {
          ...context,
          collectorProfilesLoader,
        })
      ).rejects.toThrow()
    })
  })

  describe("category name mapping", () => {
    it("maps Design/Decorative Art to Design", async () => {
      const loader = jest.fn(() =>
        Promise.resolve({
          body: [
            {
              artist: { id: "artist-1", name: "Artist" },
              representative_category: "Design/Decorative Art",
            },
          ],
          headers: { "x-total-count": "1" },
        })
      )

      const collectorProfilesLoader = jest.fn(() =>
        Promise.resolve({
          body: [
            {
              id: "collector-profile-123",
              artworkID: "artwork-123",
            },
          ],
          headers: {},
        })
      )

      const query = gql`
        query {
          collectorProfile(userID: "user-123") {
            collectedArtistsConnection(first: 1) {
              edges {
                representativeCategory
              }
            }
          }
        }
      `

      const result = await runQuery(query, {
        partnerCollectorProfileCollectedArtistsLoader: loader,
        collectorProfilesLoader,
      })

      expect(
        result.collectorProfile.collectedArtistsConnection.edges[0]
          .representativeCategory
      ).toBe("Design")
    })

    it("maps Fashion Design and Wearable Art to Fashion", async () => {
      const loader = jest.fn(() =>
        Promise.resolve({
          body: [
            {
              artist: { id: "artist-1", name: "Artist" },
              representative_category: "Fashion Design and Wearable Art",
            },
          ],
          headers: { "x-total-count": "1" },
        })
      )

      const collectorProfilesLoader = jest.fn(() =>
        Promise.resolve({
          body: [
            {
              id: "collector-profile-123",
              artworkID: "artwork-123",
            },
          ],
          headers: {},
        })
      )

      const query = gql`
        query {
          collectorProfile(userID: "user-123") {
            collectedArtistsConnection(first: 1) {
              edges {
                representativeCategory
              }
            }
          }
        }
      `

      const result = await runQuery(query, {
        partnerCollectorProfileCollectedArtistsLoader: loader,
        collectorProfilesLoader,
      })

      expect(
        result.collectorProfile.collectedArtistsConnection.edges[0]
          .representativeCategory
      ).toBe("Fashion")
    })
  })
})
