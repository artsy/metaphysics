import gql from "lib/gql"
import { runQuery } from "schema/v2/test/utils"

const article = {
  id: 12345,
  format: false,
  url: "https://news.artnet.com/market/some-article-12345",
  title: "Some Big Art Market News",
  date: "2026-07-01T10:00:00+00:00",
  updated: "2026-07-02T11:00:00+00:00",
  authors: [
    {
      name: "Jane Doe",
      title: "Senior Market Editor",
      photo: "https://secure.gravatar.com/avatar/abc?s=256",
      twitter: "https://twitter.com/janedoe",
    },
  ],
  description: "A big thing happened in the art market.",
  category: {
    name: "Market",
    slug: "market",
  },
  image: {
    main: ["https://news.artnet.com/app/news-upload/foo.jpg", 1200, 800, true],
    thumb: "https://news.artnet.com/app/news-upload/foo-square.jpg",
    alt: "A photo of the thing",
  },
}

describe("artnetNewsArticle", () => {
  it("fetches a single article by ID, including its body", async () => {
    const query = gql`
      {
        artnetNewsArticle(id: "12345") {
          internalID
          title
          url
          body
          publishedAt
          updatedAt
          description
          category {
            name
            slug
          }
          authors {
            name
            title
            photo
            twitter
          }
          image {
            url
            width
            height
            thumbnailUrl
            alt
          }
        }
      }
    `

    const context = {
      artnetNewsArticleLoader: jest.fn().mockResolvedValue({
        status: 200,
        data: {
          found_posts: 1,
          posts: [{ ...article, body: "<article><p>Hello</p></article>" }],
        },
      }),
    }

    const { artnetNewsArticle } = await runQuery(query, context)

    expect(context.artnetNewsArticleLoader).toHaveBeenCalledWith("12345")

    expect(artnetNewsArticle).toEqual({
      internalID: "12345",
      title: "Some Big Art Market News",
      url: "https://news.artnet.com/market/some-article-12345",
      body: "<article><p>Hello</p></article>",
      publishedAt: "2026-07-01T10:00:00+00:00",
      updatedAt: "2026-07-02T11:00:00+00:00",
      description: "A big thing happened in the art market.",
      category: {
        name: "Market",
        slug: "market",
      },
      authors: [
        {
          name: "Jane Doe",
          title: "Senior Market Editor",
          photo: "https://secure.gravatar.com/avatar/abc?s=256",
          twitter: "https://twitter.com/janedoe",
        },
      ],
      image: {
        url: "https://news.artnet.com/app/news-upload/foo.jpg",
        width: 1200,
        height: 800,
        thumbnailUrl: "https://news.artnet.com/app/news-upload/foo-square.jpg",
        alt: "A photo of the thing",
      },
    })
  })

  it("returns null when the article is not found", async () => {
    const query = gql`
      {
        artnetNewsArticle(id: "99999") {
          title
        }
      }
    `

    const context = {
      artnetNewsArticleLoader: jest.fn().mockResolvedValue({
        status: 200,
        data: { found_posts: 0, posts: [] },
      }),
    }

    const { artnetNewsArticle } = await runQuery(query, context)

    expect(artnetNewsArticle).toBeNull()
  })
})

describe("artnetNewsArticlesConnection", () => {
  it("fetches a page of articles and exposes the total count", async () => {
    const query = gql`
      {
        artnetNewsArticlesConnection(first: 2) {
          totalCount
          pageInfo {
            hasNextPage
          }
          edges {
            node {
              internalID
              title
            }
          }
        }
      }
    `

    const context = {
      artnetNewsArticlesLoader: jest.fn().mockResolvedValue({
        status: 200,
        data: {
          found_posts: 42,
          posts: [article, { ...article, id: 12346, title: "Another One" }],
        },
      }),
    }

    const { artnetNewsArticlesConnection } = await runQuery(query, context)

    expect(context.artnetNewsArticlesLoader).toHaveBeenCalledWith({
      paged: 1,
      posts_per_page: 2,
    })

    expect(artnetNewsArticlesConnection.totalCount).toBe(42)
    expect(artnetNewsArticlesConnection.pageInfo.hasNextPage).toBe(true)
    expect(artnetNewsArticlesConnection.edges).toEqual([
      { node: { internalID: "12345", title: "Some Big Art Market News" } },
      { node: { internalID: "12346", title: "Another One" } },
    ])
  })

  it("passes the category filter through to the API", async () => {
    const query = gql`
      {
        artnetNewsArticlesConnection(first: 5, categorySlug: "market") {
          totalCount
        }
      }
    `

    const context = {
      artnetNewsArticlesLoader: jest.fn().mockResolvedValue({
        status: 200,
        data: { found_posts: 0, posts: [] },
      }),
    }

    await runQuery(query, context)

    expect(context.artnetNewsArticlesLoader).toHaveBeenCalledWith({
      paged: 1,
      posts_per_page: 5,
      category_name: "market",
    })
  })
})
