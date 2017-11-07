import schema from "schema"
import { runQuery } from "test/utils"

describe("MatchGene", () => {
  let gravity

  const MatchGene = schema.__get__("MatchGene")

  beforeEach(() => {
    gravity = sinon.stub()
    MatchGene.__Rewire__("gravity", gravity)
  })

  afterEach(() => {
    MatchGene.__ResetDependency__("gravity")
  })

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
          big_and_tall: "https://d32dm0rphc51dk.cloudfront.net/zwMP_9kbs2XcSP\n >  TaGLJ6qw/big_and_tall.jpg",
          square500: "https://d32dm0rphc51dk.cloudfront.net/zwMP_9kbs2XcSPTaG\n >  LJ6qw/square500.jpg",
          tall: "https://d32dm0rphc51dk.cloudfront.net/zwMP_9kbs2XcSPTaGLJ6qw\n >  /tall.jpg",
          thumb: "https://d32dm0rphc51dk.cloudfront.net/zwMP_9kbs2XcSPTaGLJ6q\n >  w/thumb.jpg",
        },
        browseable: true,
      },
    ]

    gravity.withArgs("match/genes", { term: "pop" }).returns(Promise.resolve(response))

    return runQuery(query).then(data => {
      expect(data).toEqual({
        match_gene: [{ id: "pop-art", name: "Pop Art", _id: "123456" }],
      })
    })
  })
})
