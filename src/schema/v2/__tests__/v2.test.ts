import { transformToV2, TransformToV2Options } from "../index"
import {
  GravityIDFields,
  InternalIDFields,
  IDFields,
  NullableIDField,
} from "schema/object_identification"
import {
  GraphQLSchema,
  GraphQLObjectType,
  graphql,
  GraphQLFieldConfigMap,
  GraphQLNonNull,
  GraphQLID,
} from "graphql"
import gql from "lib/gql"
import { toGlobalId } from "graphql-relay"

function createSchema({
  fields,
  ...options
}: {
  fields: GraphQLFieldConfigMap<any, any>
} & Partial<TransformToV2Options>) {
  return transformToV2(
    new GraphQLSchema({
      query: new GraphQLObjectType({
        name: "Query",
        fields: {
          ...fields,
        },
      }),
    }),
    options
  )
}

describe(transformToV2, () => {
  describe("concerning cleanup", () => {
    it("filters out types", () => {
      const schema = createSchema({
        fields: {
          foo: {
            type: new GraphQLObjectType({
              name: "GetRidOfMe",
              fields: {},
            }),
          },
        },
        filterTypes: ["GetRidOfMe"],
      })
      expect(schema.getType("GetRidOfMe")).toBeUndefined()
    })

    it("filters out ID fields", () => {
      const schema = createSchema({
        fields: {
          foo: {
            type: new GraphQLObjectType({
              name: "GetRidOfID",
              fields: {
                ...InternalIDFields,
              },
            }),
          },
        },
        filterIDFieldFromTypes: ["GetRidOfID"],
      })
      expect(
        schema.getType("GetRidOfID").getFields().internalID
      ).toBeUndefined()
    })
  })

  describe("concerning ID field renaming", () => {
    it("renames __id to id", async () => {
      const rootValue = {
        fieldWithGlobalID: {
          id: "global id",
        },
      }
      const { data } = await graphql({
        schema: createSchema({
          fields: {
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

    it("throws when new id fields are added", () => {
      expect(() => {
        createSchema({
          fields: {
            fieldWithNullableID: {
              type: new GraphQLObjectType({
                name: "NullableID",
                fields: {
                  id: {
                    type: new GraphQLNonNull(GraphQLID),
                  },
                },
              }),
            },
          },
        })
      }).toThrow()
    })

    describe("on Gravity backed types", () => {
      it("renames id to gravityID", async () => {
        const rootValue = {
          fieldWithGravityResolver: {
            id: "slug or id",
          },
        }
        const { data } = await graphql({
          schema: createSchema({
            fields: {
              fieldWithGravityResolver: {
                type: new GraphQLObjectType({
                  name: "GravityType",
                  fields: {
                    ...GravityIDFields,
                  },
                }),
              },
            },
          }),
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
          schema: createSchema({
            fields: {
              fieldWithGravityResolver: {
                type: new GraphQLObjectType({
                  name: "GravityType",
                  fields: {
                    ...GravityIDFields,
                  },
                }),
              },
            },
          }),
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

      it("does not throw when the nullable id field is a known allowed type", () => {
        expect(() => {
          createSchema({
            allowedGravityTypesWithNullableIDField: ["NullableID"],
            fields: {
              fieldWithNullableID: {
                type: new GraphQLObjectType({
                  name: "NullableID",
                  fields: {
                    ...NullableIDField,
                  },
                }),
              },
            },
          })
        }).not.toThrow()
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
          schema: createSchema({
            fields: {
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

      it("renames id to internalID on stitched types that match a prefix", async () => {
        const rootValue = {
          fieldWithStitchedResolver: {
            id: "db id",
          },
        }
        const { data } = await graphql({
          schema: createSchema({
            stitchedTypePrefixes: ["Stitched"],
            fields: {
              fieldWithStitchedResolver: {
                type: new GraphQLObjectType({
                  name: "StitchedType",
                  fields: {
                    id: {
                      type: new GraphQLNonNull(GraphQLID),
                    },
                  },
                }),
              },
            },
          }),
          rootValue,
          source: gql`
            query {
              fieldWithStitchedResolver {
                internalID
              }
            }
          `,
        })
        expect(data.fieldWithStitchedResolver.internalID).toEqual("db id")
      })

      it("does not throw when the nullable id field is a known non-gravity type", () => {
        expect(() => {
          createSchema({
            allowedNonGravityTypesWithNullableIDField: ["NullableID"],
            fields: {
              fieldWithNullableID: {
                type: new GraphQLObjectType({
                  name: "NullableID",
                  fields: {
                    ...NullableIDField,
                  },
                }),
              },
            },
          })
        }).not.toThrow()
      })

      it("renames nullable id to internalID", async () => {
        const rootValue = {
          fieldWithNonGravityResolver: {
            id: null,
          },
        }
        const { data } = await graphql({
          schema: createSchema({
            allowedNonGravityTypesWithNullableIDField: ["NonGravityType"],
            fields: {
              fieldWithNonGravityResolver: {
                type: new GraphQLObjectType({
                  name: "NonGravityType",
                  fields: {
                    ...NullableIDField,
                  },
                }),
              },
            },
          }),
          rootValue,
          source: gql`
            query {
              fieldWithNonGravityResolver {
                internalID
              }
            }
          `,
        })
        expect(data.fieldWithNonGravityResolver.internalID).toEqual(null)
      })
    })
  })
})
