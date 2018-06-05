/* eslint-disable promise/always-return */
import { runQuery } from "test/utils"

describe("MatchGene", () => {
  it("queries match/genes for the term 'pop'", () => {
    const query = `
      {
        match_gene(term: "pop") {
          id
          name
          _id
        }
      }
    `
    const response = [
      {
        family: {
          _id: "575ac46debad644c13000005",
          id: "styles-and-movements",
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

    const matchGeneLoader = () => Promise.resolve(response)

    return runQuery(query, { matchGeneLoader }).then(data => {
      expect(data).toEqual({
        match_gene: [{ id: "pop-art", name: "Pop Art", _id: "123456" }],
      })
    })
  })
})
