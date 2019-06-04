import { transformToV2 } from "../index"
import { GravityIDFields, InternalIDFields } from "schema/object_identification"
import { GraphQLSchema, GraphQLObjectType, graphql } from "graphql"
import gql from "lib/gql"

const schema = transformToV2(
  new GraphQLSchema({
    query: new GraphQLObjectType({
      name: "Query",
      fields: {
        fieldWithGravityResolver: {
          type: new GraphQLObjectType({
            name: "GravityType",
            fields: {
              ...GravityIDFields,
            },
          }),
        },
        fieldWithNonGravityResolver: {
          type: new GraphQLObjectType({
            name: "NonGravityType",
            fields: {
              ...InternalIDFields,
            },
          }),
        },
      },
    }),
  })
)

describe(transformToV2, () => {
  describe("on Gravity backed types", () => {
    it("renames id to gravityID", async () => {
      const rootValue = {
        fieldWithGravityResolver: {
          id: "slug or id",
        },
      }
      const { data } = await graphql({
        schema,
        rootValue,
        source: gql`
          query {
            fieldWithGravityResolver {
              gravityID
            }
          }
        `,
      })
      expect(data.fieldWithGravityResolver.gravityID).toEqual("slug or id")
    })

    it("renames _id to internalID", async () => {
      const rootValue = {
        fieldWithGravityResolver: {
          _id: "mongo id",
        },
      }
      const { data } = await graphql({
        schema,
        rootValue,
        source: gql`
          query {
            fieldWithGravityResolver {
              internalID
            }
          }
        `,
      })
      expect(data.fieldWithGravityResolver.internalID).toEqual("mongo id")
    })
  })

  describe("on types backed by data from other places than Gravity", () => {
    it("renames id to internalID", async () => {
      const rootValue = {
        fieldWithNonGravityResolver: {
          id: "db id",
        },
      }
      const { data } = await graphql({
        schema,
        rootValue,
        source: gql`
          query {
            fieldWithNonGravityResolver {
              internalID
            }
          }
        `,
      })
      expect(data.fieldWithNonGravityResolver.internalID).toEqual("db id")
    })
  })
})
