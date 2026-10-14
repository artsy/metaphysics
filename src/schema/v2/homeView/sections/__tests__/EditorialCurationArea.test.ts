import { ResolverContext } from "types/graphql"
import { EditorialCurationArea } from "../EditorialCurationArea"
import { LatestArticles } from "../LatestArticles"

describe("EditorialCurationArea", () => {
  it("leads with the editorial rail and labels its sub-sections", () => {
    expect(EditorialCurationArea.rails).toEqual([
      { sectionID: LatestArticles.id, title: "Editorial" },
    ])
    expect(EditorialCurationArea.chipsTitle).toEqual("Art News")
    expect(EditorialCurationArea.chipsHref).toEqual("/news")
    expect(EditorialCurationArea.chipsOwnerType).toEqual("marketNews")
    expect(EditorialCurationArea.backgroundColor).toEqual("#FEF8ED")
  })

  it("maps news articles to chips with a thumbnail and href", async () => {
    const context = ({
      articlesLoader: jest.fn().mockResolvedValue({
        count: 3,
        results: [
          {
            id: "a1",
            slug: "news-one",
            title: "News One",
            thumbnail_image: { image_url: "https://ex.com/1.jpg" },
          },
          {
            id: "a2",
            slug: "news-two",
            title: "News Two",
            thumbnail_image: { image_url: "https://ex.com/2.jpg" },
          },
          {
            id: "a3",
            slug: "news-three",
            title: "News Three",
            // `:version`-templated URL — must resolve to a concrete version.
            thumbnail_image: {
              image_url: "https://ex.com/:version.jpg",
              image_versions: ["small", "large"],
            },
          },
        ],
      }),
    } as unknown) as ResolverContext

    const resolve = EditorialCurationArea.resolver! as any
    const connection = await resolve(
      EditorialCurationArea,
      { first: 10 },
      context,
      {} as any
    )
    const chips = connection.edges.map((e) => e.node)

    expect(chips).toEqual([
      {
        title: "News One",
        href: "/article/news-one",
        imageURL: "https://ex.com/1.jpg",
        entityType: "Article",
        entityID: "a1",
      },
      {
        title: "News Two",
        href: "/article/news-two",
        imageURL: "https://ex.com/2.jpg",
        entityType: "Article",
        entityID: "a2",
      },
      {
        title: "News Three",
        href: "/article/news-three",
        imageURL: "https://ex.com/large.jpg",
        entityType: "Article",
        entityID: "a3",
      },
    ])
  })
})
