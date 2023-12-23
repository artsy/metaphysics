import { GraphQLSchema, GraphQLObjectType, GraphQLScalarType } from "graphql"
import { runQueryOrThrow } from "schema/v2/test/utils"
import gql from "lib/gql"
import {
  TransformInterfaceFields,
  TransformObjectFields,
  transformSchema,
} from "graphql-tools"
import { ReplaceCommerceDateTimeType } from "../transformers/replaceCommerceDateTimeType"

const originalSchema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: "Query",
    fields: {
      someRootField: {
        type: new GraphQLObjectType({
          name: "SomeType",
          fields: {
            someCommerceDateTimeField: {
              type: new GraphQLScalarType({
                name: "CommerceDateTime",
                serialize: (x) => x,
              }),
            },
            someCommerceDateField: {
              type: new GraphQLScalarType({
                name: "CommerceDate",
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
  new TransformInterfaceFields(ReplaceCommerceDateTimeType),
  new TransformObjectFields(ReplaceCommerceDateTimeType),
])

describe("ReplaceCommerceDateTimeType", () => {
  it("replaces CommerceDateTime fields", async () => {
    const data = await runQueryOrThrow({
      schema,
      source: gql`
        query {
          someRootField {
            someCommerceDateTimeField(format: "[The year is] YYYY")
            someCommerceDateField(format: "[The year is] YYYY")
          }
        }
      `,
      rootValue: {
        someRootField: {
          someCommerceDateTimeField: "2019-07-16T19:39:10.001Z",
          someCommerceDateField: "2020-09-16T19:39:10.001Z",
        },
      },
      contextValue: {},
    })
    expect(data).toEqual({
      someRootField: {
        someCommerceDateTimeField: "The year is 2019",
        someCommerceDateField: "The year is 2020",
      },
    })
  })
})
