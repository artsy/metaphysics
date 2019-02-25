/* eslint-disable promise/always-return */
import { runQuery } from "test/utils"

describe("Search", () => {
  let searchResults: any
  let rootValue: any

  beforeEach(() => {
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
    ]

    rootValue = {
      searchLoader: () =>
        Promise.resolve({
          body: searchResults,
          headers: { "x-total-count": 100 },
        }),
      artistLoader: () => Promise.resolve({ hometown: "London, UK" }),
      artworkLoader: () => Promise.resolve({ title: "Self Portrait" }),
    }
  })

  it("returns search results for a query", () => {
    const query = `
      {
        search(query: "David Bowie", first: 10) {
          edges {
            node {
              __typename
              displayLabel
              href
              imageUrl

              ... on SearchableItem {
                searchableType
                id
                _id
              }
            }
          }
        }
      }
    `

    return runQuery(query, rootValue).then(data => {
      const artistSearchableItemNode = data!.search.edges[0].node

      expect(artistSearchableItemNode.__typename).toBe("SearchableItem")
      expect(artistSearchableItemNode.searchableType).toBe("Artist")
      expect(artistSearchableItemNode.displayLabel).toBe("David Bowie")
      expect(artistSearchableItemNode.imageUrl).toBe(
        "https://example.com/artist.jpg"
      )
      expect(artistSearchableItemNode.href).toBe("/artist/david-bowie")
      expect(artistSearchableItemNode.id).toBe("david-bowie")
      expect(artistSearchableItemNode._id).toBe("artistId")

      const artworkSearchableItemNode = data!.search.edges[1].node

      expect(artworkSearchableItemNode.__typename).toBe("SearchableItem")
      expect(artworkSearchableItemNode.searchableType).toBe("Artwork")
      expect(artworkSearchableItemNode.displayLabel).toBe("Self Portrait")
      expect(artworkSearchableItemNode.imageUrl).toBe(
        "https://example.com/artwork.jpg"
      )
      expect(artworkSearchableItemNode.href).toBe(
        "/artwork/david-bowie-self-portrait"
      )

      expect(artworkSearchableItemNode.id).toBe("david-bowie-self-portrait")
      expect(artworkSearchableItemNode._id).toBe("artworkId")

      const gallerySearchableItemNode = data!.search.edges[2].node
      expect(gallerySearchableItemNode.searchableType).toBe("Gallery")
      expect(gallerySearchableItemNode.href).toBe("/catty-gallery")

      const museumSearchableItemNode = data!.search.edges[3].node
      expect(museumSearchableItemNode.searchableType).toBe("Institution")
      expect(museumSearchableItemNode.href).toBe("/catty-museum")

      const fairSearchableItemNode = data!.search.edges[4].node
      expect(fairSearchableItemNode.searchableType).toBe("Fair")

      const geneSearchableItemNode = data!.search.edges[5].node
      expect(geneSearchableItemNode.searchableType).toBe("Category")
      expect(geneSearchableItemNode.href).toBe("/gene/catty-gene")

      const auctionSearchableItemNode = data!.search.edges[6].node
      expect(auctionSearchableItemNode.searchableType).toBe("Auction")
      expect(auctionSearchableItemNode.href).toBe("/auction/catty-auction")
    })
  })

  it("fetches artist if Artist-specific attributes are requested", () => {
    const query = `
      {
        search(query: "David Bowie", first: 10) {
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

    return runQuery(query, rootValue).then(data => {
      const artistNode = data!.search.edges[0].node

      expect(artistNode.__typename).toBe("Artist")
      expect(artistNode.hometown).toBe("London, UK")
    })
  })

  it("fetches artwork if Artwork-specific attributes are requested", () => {
    const query = `
      {
        search(query: "David Bowie", first: 10) {
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

    return runQuery(query, rootValue).then(data => {
      const artworkNode = data!.search.edges[1].node

      expect(artworkNode.__typename).toBe("Artwork")
      expect(artworkNode.title).toBe("Self Portrait")
    })
  })
})
