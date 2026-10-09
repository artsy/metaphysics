import { ResolverContext } from "types/graphql"
import { EditorialCurationArea } from "../EditorialCurationArea"
import { LatestArticles } from "../LatestArticles"

describe("EditorialCurationArea", () => {
  it("leads with the editorial rail and labels its sub-sections", () => {
    expect(EditorialCurationArea.leadSectionID).toEqual(LatestArticles.id)
    expect(EditorialCurationArea.leadTitle).toEqual("Editorial")
    expect(EditorialCurationArea.chipsTitle).toEqual("Art News")
    expect(EditorialCurationArea.chipsHref).toEqual("/news")
  })

  it("maps news articles to chips with a thumbnail and href", async () => {
    const context = ({
      articlesLoader: jest.fn().mockResolvedValue({
        count: 2,
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
    ])
  })
})
