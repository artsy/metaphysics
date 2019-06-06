import { transformToV2 } from "../index"
import {
  GravityIDFields,
  InternalIDFields,
  IDFields,
} from "schema/object_identification"
import { GraphQLSchema, GraphQLObjectType, graphql } from "graphql"
import gql from "lib/gql"
import { toGlobalId } from "graphql-relay"

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
        fieldWithGlobalID: {
          type: new GraphQLObjectType({
            name: "AnyType",
            fields: {
              ...IDFields,
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

  it("renames __id to id", async () => {
    const rootValue = {
      fieldWithGlobalID: {
        id: "global id",
      },
    }
    const { data } = await graphql({
      schema,
      rootValue,
      source: gql`
        query {
          fieldWithGlobalID {
            id
          }
        }
      `,
    })
    expect(data.fieldWithGlobalID.id).toEqual(
      toGlobalId("AnyType", "global id")
    )
  })
})
