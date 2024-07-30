import { GraphQLSchema, GraphQLObjectType, GraphQLScalarType } from "graphql"
import { runQueryOrThrow } from "schema/v2/test/utils"
import gql from "lib/gql"
import { transformSchema } from "graphql-tools"
import { ReplaceCommerceDateTimeType } from "../transformers/replaceCommerceDateTimeType"

const originalSchema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: "Query",
    fields: {
      someRootField: {
        type: new GraphQLObjectType({
          name: "SomeType",
          fields: {
            someDateField: {
              type: new GraphQLScalarType({
                name: "CommerceDateTime",
                serialize: (x) => x,
              }),
            },
          },
        }),
      },
    },
  }),
})

const schema = transformSchema(originalSchema, [
  new ReplaceCommerceDateTimeType(),
])

describe("ReplaceCommerceDateTimeType", () => {
  it("replaces CommerceDateTime fields", async () => {
    const data = await runQueryOrThrow({
      schema,
      source: gql`
        query {
          someRootField {
            someDateField(format: "[The year is] YYYY")
          }
        }
      `,
      rootValue: {
        someRootField: {
          someDateField: "2019-07-16T19:39:10.001Z",
        },
      },
      contextValue: {},
    })
    expect(data).toEqual({
      someRootField: {
        someDateField: "The year is 2019",
      },
    })
  })
})
