import { runQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

const query = gql`
  {
    article(id: "example") {
      sections {
        ... on ArticleSectionVideo {
          aspectRatio
        }
      }
    }
  }
`

const runWithVideo = (video: Record<string, unknown>) => {
  const articleLoader = jest.fn(() =>
    Promise.resolve({
      sections: [{ type: "video", url: "https://vimeo.com/1", ...video }],
    })
  )
  return runQuery(query, { articleLoader })
}

describe("ArticleSectionVideo", () => {
  it("returns the saved aspect ratio", async () => {
    const { article } = await runWithVideo({ aspect_ratio: 0.5625 })

    expect(article.sections).toEqual([{ aspectRatio: 0.5625 }])
  })

  it("defaults to 16:9 when unset", async () => {
    const { article } = await runWithVideo({})

    expect(article.sections).toEqual([{ aspectRatio: 16 / 9 }])
  })

  it("defaults to 16:9 for invalid values", async () => {
    const { article } = await runWithVideo({ aspect_ratio: -1 })

    expect(article.sections).toEqual([{ aspectRatio: 16 / 9 }])
  })
})
