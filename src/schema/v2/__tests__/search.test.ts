/* eslint-disable promise/always-return */
import { runQuery } from "schema/v2/test/utils"

describe("Search", () => {
  let searchResults: any
  let aggregations: any
  let context: any
  let searchResponse: any

  beforeEach(() => {
    aggregations = {
      _type: {
        profile: {
          name: "profile",
          count: 100,
        },
        artist: {
          name: "artist",
          count: 50,
        },
        artwork: {
          name: "artwork",
          count: 25,
        },
      },
    }
    searchResults = [
      {
        _id: "artistId",
        label: "Artist",
        model: "artist",
        id: "david-bowie",
        display: "David Bowie",
        image_url: "https://example.com/artist.jpg",
      },
      {
        _id: "artworkId",
        id: "david-bowie-self-portrait",
        label: "Artwork",
        model: "artwork",
        display: "Self Portrait",
        image_url: "https://example.com/artwork.jpg",
      },
      {
        _id: "galleryID",
        id: "catty-gallery",
        label: "Profile",
        model: "profile",
        owner_type: "PartnerGallery",
      },
      {
        _id: "museumID",
        id: "catty-museum",
        label: "Profile",
        model: "profile",
        owner_type: "PartnerInstitution",
      },
      {
        _id: "fairID",
        id: "catty-fair",
        label: "Profile",
        model: "profile",
        owner_type: "FairOrganizer",
      },
      {
        _id: "geneID",
        id: "catty-gene",
        label: "Gene",
        model: "gene",
      },
      {
        _id: "auctionID",
        id: "catty-auction",
        label: "Sale",
        model: "sale",
      },
      {
        _id: "collectionID",
        id: "catty-collection",
        label: "MarketingCollection",
        model: "marketingcollection",
      },
    ]

    context = {
      artistLoader: () => Promise.resolve({ hometown: "London, UK" }),
      artworkLoader: () => Promise.resolve({ title: "Self Portrait" }),
      geneLoader: () => Promise.resolve({ name: "Minimalism" }),
    }

    searchResponse = Promise.resolve({
      body: searchResults,
      headers: { "x-total-count": 40 },
    })
  })

  it("returns search results for a query", () => {
    const query = `
      {
        searchConnection(query: "David Bowie", first: 10) {
          edges {
            node {
              __typename
              displayLabel
              href
              imageUrl

              ... on SearchableItem {
                displayType 
                internalID
                slug
              }
            }
          }
        }
      }
    `

    context.searchLoader = jest.fn().mockImplementation(() => searchResponse)
    return runQuery(query, context).then((data) => {
      const artistSearchableItemNode = data!.searchConnection.edges[0].node

      expect(artistSearchableItemNode.__typename).toBe("SearchableItem")
      expect(artistSearchableItemNode.displayType).toBe("Artist")
      expect(artistSearchableItemNode.displayLabel).toBe("David Bowie")
      expect(artistSearchableItemNode.imageUrl).toBe(
        "https://example.com/artist.jpg"
      )
      expect(artistSearchableItemNode.href).toBe("/artist/david-bowie")
      expect(artistSearchableItemNode.slug).toBe("david-bowie")
      expect(artistSearchableItemNode.internalID).toBe("artistId")

      const artworkSearchableItemNode = data!.searchConnection.edges[1].node

      expect(artworkSearchableItemNode.__typename).toBe("SearchableItem")
      expect(artworkSearchableItemNode.displayType).toBe("Artwork")
      expect(artworkSearchableItemNode.displayLabel).toBe("Self Portrait")
      expect(artworkSearchableItemNode.imageUrl).toBe(
        "https://example.com/artwork.jpg"
      )
      expect(artworkSearchableItemNode.href).toBe(
        "/artwork/david-bowie-self-portrait"
      )

      expect(artworkSearchableItemNode.slug).toBe("david-bowie-self-portrait")
      expect(artworkSearchableItemNode.internalID).toBe("artworkId")

      const gallerySearchableItemNode = data!.searchConnection.edges[2].node
      expect(gallerySearchableItemNode.displayType).toBe("Gallery")
      expect(gallerySearchableItemNode.href).toBe("/catty-gallery")

      const museumSearchableItemNode = data!.searchConnection.edges[3].node
      expect(museumSearchableItemNode.displayType).toBe("Institution")
      expect(museumSearchableItemNode.href).toBe("/catty-museum")

      const fairSearchableItemNode = data!.searchConnection.edges[4].node
      expect(fairSearchableItemNode.displayType).toBe("Fair")

      const geneSearchableItemNode = data!.searchConnection.edges[5].node
      expect(geneSearchableItemNode.displayType).toBe("Category")
      expect(geneSearchableItemNode.href).toBe("/gene/catty-gene")

      const auctionSearchableItemNode = data!.searchConnection.edges[6].node
      expect(auctionSearchableItemNode.displayType).toBe("Auction")
      expect(auctionSearchableItemNode.href).toBe("/auction/catty-auction")

      const collectionSearchableItemNode = data!.searchConnection.edges[7].node
      expect(collectionSearchableItemNode.displayType).toBe("Collection")
      expect(collectionSearchableItemNode.href).toBe(
        "/collection/catty-collection"
      )
    })
  })

  it("returns `hasNextPage`", () => {
    const query = `
      {
        searchConnection(query: "David Bowie", first: 10) {
          pageInfo {
            hasNextPage
          }
        }
      }
    `
    context.searchLoader = jest.fn().mockImplementation(() => searchResponse)

    return runQuery(query, context).then((data) => {
      expect(data!.searchConnection.pageInfo.hasNextPage).toBeTruthy()
    })
  })

  it("passes an incoming page param and correctly computes the cursor", () => {
    const query = `
      {
        searchConnection(query: "David Bowie", first: 20, page: 30, after: "") {
          pageInfo {
            endCursor
          }
        }
      }
    `
    context.searchLoader = jest.fn().mockImplementation(() => searchResponse)

    return runQuery(query, context).then((data) => {
      const { page, size } = context.searchLoader.mock.calls[0][0]
      expect(page).toEqual(30)
      expect(size).toEqual(20)
      // Check that the cursor points to the end of page 20, size 30.
      // Base64 encoded string: `arrayconnection:599`
      expect(data!.searchConnection.pageInfo.endCursor).toEqual(
        "YXJyYXljb25uZWN0aW9uOjU5OQ=="
      )
    })
  })

  it("can return aggregations", () => {
    const query = `
      {
        searchConnection(query: "David Bowie", first: 10, aggregations: [TYPE]) {
          aggregations {
            slice
            counts {
              name
              count
            }
          }
        }
      }
    `
    const searchResponseWithAggregations = {
      body: { results: searchResults, aggregations },
      headers: { "x-total-count": 100 },
    }
    context.searchLoader = jest
      .fn()
      .mockImplementation(() => Promise.resolve(searchResponseWithAggregations))

    return runQuery(query, context).then((data) => {
      const typeAggregation = data!.searchConnection.aggregations.find(
        (agg) => agg.slice === "TYPE"
      ).counts

      const profileCount = typeAggregation.find((agg) => agg.name === "profile")
      expect(profileCount.count).toBe(100)
      const artistCount = typeAggregation.find((agg) => agg.name === "artist")
      expect(artistCount.count).toBe(50)
      const artworkCount = typeAggregation.find((agg) => agg.name === "artwork")
      expect(artworkCount.count).toBe(25)
    })
  })

  it("fetches artist if Artist-specific attributes are requested", () => {
    const query = `
      {
        searchConnection(query: "David Bowie", first: 10) {
          edges {
            node {
              __typename

              ... on Artist {
                hometown
              }
            }
          }
        }
      }
    `
    context.searchLoader = jest.fn().mockImplementation(() => searchResponse)

    return runQuery(query, context).then((data) => {
      const artistNode = data!.searchConnection.edges[0].node

      expect(artistNode.__typename).toBe("Artist")
      expect(artistNode.hometown).toBe("London, UK")
    })
  })

  it("doesn't include artist which return in search results but no longer exist", () => {
    const query = `
      {
        searchConnection(query: "David Bowie", first: 10) {
          edges {
            node {
              __typename

              ... on Artist {
                hometown
              }
            }
          }
        }
      }
    `
    context.searchLoader = jest.fn().mockImplementation(() => searchResponse)
    context.artistLoader = jest
      .fn()
      .mockImplementation(() => Promise.reject("Artist not found"))

    return runQuery(query, context).then((data) => {
      expect(data!.searchConnection.edges.length).toBe(7) // 8 results, but one is an artist that doesn't exist
      const typeNames = data!.searchConnection.edges.map(
        (edge) => edge.node.__typename
      )
      expect(typeNames).not.toContain("Artist")
    })
  })

  it("fetches artwork if Artwork-specific attributes are requested", () => {
    const query = `
      {
        searchConnection(query: "David Bowie", first: 10) {
          edges {
            node {
              __typename

              ... on Artwork {
                title
              }
            }
          }
        }
      }
    `
    context.searchLoader = jest.fn().mockImplementation(() => searchResponse)

    return runQuery(query, context).then((data) => {
      const artworkNode = data!.searchConnection.edges[1].node

      expect(artworkNode.__typename).toBe("Artwork")
      expect(artworkNode.title).toBe("Self Portrait")
    })
  })

  it("fetches gene if Gene-specific attributes are requested", () => {
    const query = `
      {
        searchConnection(query: "minimalism", first: 10) {
          edges {
            node {
              __typename

              ... on Gene {
                name
              }
            }
          }
        }
      }
    `
    context.searchLoader = jest.fn().mockImplementation(() => searchResponse)

    return runQuery(query, context).then((data) => {
      const geneNode = data!.searchConnection.edges[5].node

      expect(geneNode.__typename).toBe("Gene")
      expect(geneNode.name).toBe("Minimalism")
    })
  })

  it("Removes leading and trailing whitespace characters from the query", async () => {
    const query = `
      {
        searchConnection(query: "  David Bowie  ", first: 10) {
          edges {
            node {
              __typename
            }
          }
        }
      }
    `
    context.searchLoader = jest.fn().mockImplementation(() => searchResponse)

    await runQuery(query, context)

    // confirm that searchLoader was called with the trimmed query
    expect(context.searchLoader.mock.calls[0][0].query).toBe("David Bowie")
  })

  describe("visibleToPublic parameter", () => {
    it("passes visibleToPublic parameter to searchLoader when authenticated", async () => {
      const query = `
        {
          searchConnection(query: "David Bowie", first: 10, visibleToPublic: false) {
            edges {
              node {
                __typename
              }
            }
          }
        }
      `
      context.searchLoader = jest.fn().mockImplementation(() => searchResponse)
      context.internalSearchLoader = jest
        .fn()
        .mockImplementation(() => searchResponse)

      await runQuery(query, context)

      expect(context.searchLoader.mock.calls[0][0].visible_to_public).toBe(
        false
      )
    })

    it("passes visibleToPublic parameter when true", async () => {
      const query = `
        {
          searchConnection(query: "David Bowie", first: 10, visibleToPublic: true) {
            edges {
              node {
                __typename
              }
            }
          }
        }
      `
      context.searchLoader = jest.fn().mockImplementation(() => searchResponse)
      context.internalSearchLoader = jest
        .fn()
        .mockImplementation(() => searchResponse)

      await runQuery(query, context)

      expect(context.searchLoader.mock.calls[0][0].visible_to_public).toBe(true)
    })

    it("throws error when visibleToPublic is provided without authentication", async () => {
      const query = `
        {
          searchConnection(query: "David Bowie", first: 10, visibleToPublic: false) {
            edges {
              node {
                __typename
              }
            }
          }
        }
      `
      context.searchLoader = jest.fn().mockImplementation(() => searchResponse)
      delete context.internalSearchLoader

      await expect(runQuery(query, context)).rejects.toThrow(
        "You need to pass a X-Access-Token header to perform this action"
      )
    })

    it("does not pass visible_to_public when visibleToPublic is not provided", async () => {
      const query = `
        {
          searchConnection(query: "David Bowie", first: 10) {
            edges {
              node {
                __typename
              }
            }
          }
        }
      `
      context.searchLoader = jest.fn().mockImplementation(() => searchResponse)

      await runQuery(query, context)

      expect(
        context.searchLoader.mock.calls[0][0].visible_to_public
      ).toBeUndefined()
    })
  })
})
