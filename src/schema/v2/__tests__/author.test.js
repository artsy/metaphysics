/* eslint-disable promise/always-return */
import { runQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

describe("Author", () => {
  let context = null

  const authorData = {
    id: "68e5291d85794e91342744e0",
    slug: "jane-doe",
    name: "Jane Doe",
    bio: "An amazing author",
    image_url: "https://example.com/author.jpg",
    twitter_handle: "@janedoe",
    instagram_handle: "@janedoe_art",
    role: "Editor",
  }

  beforeEach(() => {
    context = {
      authorLoader: jest.fn().mockResolvedValue(authorData),
      articlesLoader: jest.fn().mockResolvedValue({ results: [] }),
    }
  })

  it("fetches an author by slug", () => {
    const query = gql`
      {
        author(id: "jane-doe") {
          slug
          internalID
          name
          bio
        }
      }
    `

    return runQuery(query, context).then((data) => {
      expect(context.authorLoader).toHaveBeenCalledWith("jane-doe")
      expect(data.author.slug).toBe("jane-doe")
      expect(data.author.internalID).toBe("68e5291d85794e91342744e0")
      expect(data.author.name).toBe("Jane Doe")
      expect(data.author.bio).toBe("An amazing author")
    })
  })

  it("fetches an author by internal ID", () => {
    const query = gql`
      {
        author(id: "68e5291d85794e91342744e0") {
          slug
          internalID
          name
        }
      }
    `

    return runQuery(query, context).then((data) => {
      expect(context.authorLoader).toHaveBeenCalledWith(
        "68e5291d85794e91342744e0"
      )
      expect(data.author.slug).toBe("jane-doe")
      expect(data.author.internalID).toBe("68e5291d85794e91342744e0")
      expect(data.author.name).toBe("Jane Doe")
    })
  })

  it("includes all slug and ID fields", () => {
    const query = gql`
      {
        author(id: "jane-doe") {
          id
          slug
          internalID
        }
      }
    `

    return runQuery(query, context).then((data) => {
      expect(data.author.id).toBeDefined() // Global Relay ID
      expect(data.author.slug).toBe("jane-doe")
      expect(data.author.internalID).toBe("68e5291d85794e91342744e0")
    })
  })

  it("handles author without slug", () => {
    const authorWithoutSlug = {
      ...authorData,
      slug: null, // No slug available
    }
    context.authorLoader.mockResolvedValue(authorWithoutSlug)

    const query = gql`
      {
        author(id: "68e5291d85794e91342744e0") {
          slug
          internalID
          name
        }
      }
    `

    return runQuery(query, context).then((data) => {
      expect(data.author.slug).toBeNull()
      expect(data.author.internalID).toBe("68e5291d85794e91342744e0")
      expect(data.author.name).toBe("Jane Doe")
    })
  })

  it("handles author with image", () => {
    const query = gql`
      {
        author(id: "jane-doe") {
          name
          image {
            url
          }
        }
      }
    `

    return runQuery(query, context).then((data) => {
      expect(data.author.name).toBe("Jane Doe")
      expect(data.author.image.url).toBe("https://example.com/author.jpg")
    })
  })

  it("returns initials", () => {
    const query = gql`
      {
        author(id: "jane-doe") {
          initials
        }
      }
    `

    return runQuery(query, context).then((data) => {
      expect(data.author.initials).toBe("JD")
    })
  })

  it("returns social media handles", () => {
    const query = gql`
      {
        author(id: "jane-doe") {
          twitterHandle
          instagramHandle
          socials {
            x {
              handle
              url
            }
            instagram {
              handle
              url
            }
          }
        }
      }
    `

    return runQuery(query, context).then((data) => {
      expect(data.author.twitterHandle).toBe("@janedoe")
      expect(data.author.instagramHandle).toBe("@janedoe_art")
      expect(data.author.socials.x.handle).toBe("janedoe")
      expect(data.author.socials.x.url).toBe("https://x.com/janedoe")
      expect(data.author.socials.instagram.handle).toBe("janedoe_art")
      expect(data.author.socials.instagram.url).toBe(
        "https://instagram.com/janedoe_art"
      )
    })
  })

  it("returns role", () => {
    const query = gql`
      {
        author(id: "jane-doe") {
          role
        }
      }
    `

    return runQuery(query, context).then((data) => {
      expect(data.author.role).toBe("Editor")
    })
  })

  it("returns articles", () => {
    const mockArticles = [
      { id: "article-1", title: "First Article" },
      { id: "article-2", title: "Second Article" },
    ]
    context.articlesLoader.mockResolvedValue({ results: mockArticles })

    const query = gql`
      {
        author(id: "jane-doe") {
          articles {
            internalID
          }
        }
      }
    `

    return runQuery(query, context).then((data) => {
      expect(context.articlesLoader).toHaveBeenCalledWith({
        author_ids: "68e5291d85794e91342744e0",
      })
      expect(data.author.articles).toHaveLength(2)
    })
  })

  it("handles author without social media", () => {
    const authorWithoutSocials = {
      ...authorData,
      twitter_handle: null,
      instagram_handle: null,
    }
    context.authorLoader.mockResolvedValue(authorWithoutSocials)

    const query = gql`
      {
        author(id: "jane-doe") {
          socials {
            x {
              handle
            }
            instagram {
              handle
            }
          }
        }
      }
    `

    return runQuery(query, context).then((data) => {
      expect(data.author.socials).toBeNull()
    })
  })

  it("handles author without image", () => {
    const authorWithoutImage = {
      ...authorData,
      image_url: null,
    }
    context.authorLoader.mockResolvedValue(authorWithoutImage)

    const query = gql`
      {
        author(id: "jane-doe") {
          image {
            url
          }
        }
      }
    `

    return runQuery(query, context).then((data) => {
      expect(data.author.image).toBeNull()
    })
  })
})
