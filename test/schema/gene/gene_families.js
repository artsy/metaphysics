import schema from "../../../schema"
import { runQuery } from "../../utils"

describe("GeneFamilies", () => {
  const GeneFamilies = schema.__get__("GeneFamilies")
  let gravity = null
  const api_data = [
    {
      id: "design-concepts-and-techniques",
      name: "Design Concepts and Techniques",
    },
    {
      id: "furniture-and-lighting",
      name: "Furniture & Lighting",
    },
  ]

  beforeEach(() => {
    gravity = sinon.stub()
    gravity.returns(Promise.resolve(api_data))
    GeneFamilies.__Rewire__("gravity", gravity)
  })

  afterEach(() => {
    GeneFamilies.__ResetDependency__("gravity")
  })

  it("returns a list of gene families", () => {
    const query = `
      {
        gene_families {
          id
          name
        }
      }
    `

    return runQuery(query).then(data => {
      expect(data).toEqual({
        gene_families: [
          {
            id: "design-concepts-and-techniques",
            name: "Design Concepts and Techniques",
          },
          {
            id: "furniture-and-lighting",
            name: "Furniture & Lighting",
          },
        ],
      })
    })
  })
})
