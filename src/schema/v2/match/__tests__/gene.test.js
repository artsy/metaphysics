/* eslint-disable promise/always-return */
import { runQuery } from "schema/v2/test/utils"

describe.skip("MatchGene", () => {
  it("queries match/genes for the term 'pop'", () => {
    const query = `
      {
        matchGene(term: "pop") {
          slug
          name
          internalID
        }
      }
    `
    const response = [
      {
        family: {
          internalID: "575ac46debad644c13000005",
          slug: "styles-and-movements",
          name: "Styles and Movements",
        },
        _id: "123456",
        id: "pop-art",
        name: "Pop Art",
        image_urls: {
          big_and_tall:
            "https://d32dm0rphc51dk.cloudfront.net/zwMP_9kbs2XcSP\n >  TaGLJ6qw/big_and_tall.jpg",
          square500:
            "https://d32dm0rphc51dk.cloudfront.net/zwMP_9kbs2XcSPTaG\n >  LJ6qw/square500.jpg",
          tall:
            "https://d32dm0rphc51dk.cloudfront.net/zwMP_9kbs2XcSPTaGLJ6qw\n >  /tall.jpg",
          thumb:
            "https://d32dm0rphc51dk.cloudfront.net/zwMP_9kbs2XcSPTaGLJ6q\n >  w/thumb.jpg",
        },
        browseable: true,
      },
    ]

    const matchGenesLoader = () => Promise.resolve(response)

    return runQuery(query, { matchGenesLoader }).then((data) => {
      expect(data).toEqual({
        matchGene: [{ slug: "pop-art", name: "Pop Art", internalID: "123456" }],
      })
    })
  })
})
