import { graphql, GraphQLObjectType, GraphQLSchema } from "graphql"
import { ArticleSectionEmbed } from "../ArticleSectionEmbed"

const schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: "Query",
    fields: {
      embed: { type: ArticleSectionEmbed },
    },
  }),
})

const run = (embed: Record<string, unknown>) =>
  graphql({
    schema,
    source: `{ embed { height mobileHeight } }`,
    rootValue: { embed },
  })

describe("ArticleSectionEmbed", () => {
  it("coerces empty-string heights to null instead of throwing", async () => {
    const result = await run({ type: "embed", height: "", mobile_height: "" })

    expect(result.errors).toBeUndefined()
    expect(result.data?.embed).toEqual({ height: null, mobileHeight: null })
  })

  it("coerces non-numeric heights to null", async () => {
    const result = await run({
      type: "embed",
      height: "abc",
      mobile_height: "12px",
    })

    expect(result.errors).toBeUndefined()
    expect(result.data?.embed).toEqual({ height: null, mobileHeight: null })
  })

  it("passes through valid integer heights (including numeric strings)", async () => {
    const result = await run({
      type: "embed",
      height: 480,
      mobile_height: "300",
    })

    expect(result.errors).toBeUndefined()
    expect(result.data?.embed).toEqual({ height: 480, mobileHeight: 300 })
  })
})
