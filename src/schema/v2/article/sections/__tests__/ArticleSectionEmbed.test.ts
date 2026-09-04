import { runQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

const query = gql`
  {
    article(id: "example") {
      sections {
        ... on ArticleSectionEmbed {
          height
          mobileHeight
        }
      }
    }
  }
`

const runWithEmbed = (embed: Record<string, unknown>) => {
  const articleLoader = jest.fn(() =>
    Promise.resolve({ sections: [{ type: "embed", ...embed }] })
  )
  return runQuery(query, { articleLoader })
}

describe("ArticleSectionEmbed", () => {
  it("coerces empty-string heights to null instead of throwing", async () => {
    const { article } = await runWithEmbed({ height: "", mobile_height: "" })

    expect(article.sections).toEqual([{ height: null, mobileHeight: null }])
  })

  it("coerces non-numeric heights to null", async () => {
    const { article } = await runWithEmbed({
      height: "abc",
      mobile_height: "12px",
    })

    expect(article.sections).toEqual([{ height: null, mobileHeight: null }])
  })

  it("passes through valid integer heights (including numeric strings)", async () => {
    const { article } = await runWithEmbed({
      height: 480,
      mobile_height: "300",
    })

    expect(article.sections).toEqual([{ height: 480, mobileHeight: 300 }])
  })
})
