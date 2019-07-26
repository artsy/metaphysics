import {
  transformToV2,
  TransformToV2Options,
  FILTER_DEPRECATIONS,
} from "../index"
import {
  GravityIDFields,
  InternalIDFields,
  IDFields,
  NullableIDField,
  GlobalIDField,
  SlugAndInternalIDFields,
} from "schema/v2/object_identification"
import {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLFieldConfigMap,
  GraphQLNonNull,
  GraphQLID,
  GraphQLInterfaceType,
  GraphQLString,
  GraphQLInt,
} from "graphql"
import gql from "lib/gql"
import { toGlobalId } from "graphql-relay"
import { deprecate } from "lib/deprecation"
import { runQueryOrThrow } from "schema/v2/test/utils"

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

    it("removes previously deprecated fields", () => {
      const schema = createSchema({
        fields: {
          deprecatedField: {
            type: GraphQLString,
            deprecationReason: deprecate({
              inVersion: 2,
              preferUsageOf: "bar",
            }),
          },
        },
      })
      const deprecatedField = schema.getQueryType().getFields()[
        "deprecatedField"
      ]
      if (FILTER_DEPRECATIONS) {
        expect(deprecatedField).toBeUndefined()
      } else {
        expect(deprecatedField).not.toBeUndefined()
      }
    })
  })

  it("puts fields with the v2 prefix in place", async () => {
    const rootValue = {
      fieldForV2: {
        someField: 42,
        v2_someField: "a v2 value",
      },
    }
    const data = await runQueryOrThrow({
      schema: createSchema({
        fields: {
          fieldForV2: {
            type: new GraphQLObjectType({
              name: "AnyType",
              fields: {
                v2_someField: {
                  type: GraphQLString,
                },
                someField: {
                  type: GraphQLInt,
                },
              },
              interfaces: [
                new GraphQLInterfaceType({
                  name: "AnInterface",
                  fields: {
                    someField: {
                      type: GraphQLInt,
                    },
                    v2_someField: {
                      type: GraphQLString,
                    },
                  },
                }),
              ],
            }),
          },
        },
      }),
      rootValue,
      source: gql`
        query {
          fieldForV2 {
            someField
            ... on AnInterface {
              someField
            }
          }
        }
      `,
    })
    expect(data.fieldForV2.someField).toEqual("a v2 value")
  })

  describe("concerning ID renaming", () => {
    it("renames __id field to id", async () => {
      const rootValue = {
        fieldWithGlobalID: {
          id: "global id",
        },
      }
      const data = await runQueryOrThrow({
        schema: createSchema({
          fields: {
            fieldWithGlobalID: {
              type: new GraphQLObjectType({
                name: "AnyType",
                fields: {
                  ...IDFields,
                },
                interfaces: [
                  new GraphQLInterfaceType({
                    name: "AnInterface",
                    fields: {
                      ...IDFields,
                    },
                  }),
                ],
              }),
            },
          },
        }),
        rootValue,
        source: gql`
          query {
            fieldWithGlobalID {
              id
              ... on AnInterface {
                id
              }
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
      it("renames id field to internalID", async () => {
        const rootValue = {
          fieldWithGravityResolver: {
            id: "id value from gravity",
          },
        }
        const data = await runQueryOrThrow({
          schema: createSchema({
            fields: {
              fieldWithGravityResolver: {
                type: new GraphQLObjectType({
                  name: "GravityType",
                  fields: {
                    ...InternalIDFields,
                  },
                  interfaces: [
                    new GraphQLInterfaceType({
                      name: "AnInterface",
                      fields: {
                        ...InternalIDFields,
                      },
                    }),
                  ],
                }),
              },
            },
          }),
          rootValue,
          source: gql`
            query {
              fieldWithGravityResolver {
                internalID
                ... on AnInterface {
                  internalID
                }
              }
            }
          `,
        })
        expect(data.fieldWithGravityResolver.internalID).toEqual(
          "id value from gravity"
        )
      })
      it("renames id field to slug", async () => {
        const rootValue = {
          fieldWithGravityResolver: {
            id: "slug value from gravity",
            _id: "internal id value from gravity",
          },
        }
        const data = await runQueryOrThrow({
          schema: createSchema({
            fields: {
              fieldWithGravityResolver: {
                type: new GraphQLObjectType({
                  name: "GravityType",
                  fields: {
                    ...SlugAndInternalIDFields,
                  },
                  interfaces: [
                    new GraphQLInterfaceType({
                      name: "AnInterface",
                      fields: {
                        ...SlugAndInternalIDFields,
                      },
                    }),
                  ],
                }),
              },
            },
          }),
          rootValue,
          source: gql`
            query {
              fieldWithGravityResolver {
                internalID
                slug
                ... on AnInterface {
                  internalID
                  slug
                }
              }
            }
          `,
        })
        expect(data.fieldWithGravityResolver.slug).toEqual(
          "slug value from gravity"
        )
        expect(data.fieldWithGravityResolver.internalID).toEqual(
          "internal id value from gravity"
        )
      })

      // TODO: I'm in progress on completely removing this type
      xit("renames _id field to internalID", async () => {
        const rootValue = {
          fieldWithGravityResolver: {
            _id: "mongo id",
          },
        }
        const data = await runQueryOrThrow({
          schema: createSchema({
            fields: {
              fieldWithGravityResolver: {
                type: new GraphQLObjectType({
                  name: "GravityType",
                  fields: {
                    ...GravityIDFields,
                  },
                  interfaces: [
                    new GraphQLInterfaceType({
                      name: "AnInterface",
                      fields: {
                        ...GravityIDFields,
                      },
                    }),
                  ],
                }),
              },
            },
          }),
          rootValue,
          source: gql`
            query {
              fieldWithGravityResolver {
                internalID
                ... on AnInterface {
                  internalID
                }
              }
            }
          `,
        })
        expect(data.fieldWithGravityResolver.internalID).toEqual("mongo id")
      })

      it("does not throw when the nullable id field is a known allowed type", () => {
        expect(() => {
          createSchema({
            allowedGravityTypesWithNullableIDField: [
              "NullableID",
              "AnInterface",
            ],
            fields: {
              fieldWithNullableID: {
                type: new GraphQLObjectType({
                  name: "NullableID",
                  fields: {
                    ...NullableIDField,
                  },
                  interfaces: [
                    new GraphQLInterfaceType({
                      name: "AnInterface",
                      fields: {
                        ...NullableIDField,
                      },
                    }),
                  ],
                }),
              },
            },
          })
        }).not.toThrow()
      })
    })

    describe("on types backed by data from other places than Gravity", () => {
      it("renames id field to internalID", async () => {
        const rootValue = {
          fieldWithNonGravityResolver: {
            id: "db id",
          },
        }
        const data = await runQueryOrThrow({
          schema: createSchema({
            fields: {
              fieldWithNonGravityResolver: {
                type: new GraphQLObjectType({
                  name: "NonGravityType",
                  fields: {
                    ...InternalIDFields,
                  },
                  interfaces: [
                    new GraphQLInterfaceType({
                      name: "AnInterface",
                      fields: {
                        ...InternalIDFields,
                      },
                    }),
                  ],
                }),
              },
            },
          }),
          rootValue,
          source: gql`
            query {
              fieldWithNonGravityResolver {
                internalID
                ... on AnInterface {
                  internalID
                }
              }
            }
          `,
        })
        expect(data.fieldWithNonGravityResolver.internalID).toEqual("db id")
      })

      it("renames id field to internalID on stitched types that match a prefix", async () => {
        const rootValue = {
          fieldWithStitchedResolver: {
            id: "db id",
          },
        }
        const data = await runQueryOrThrow({
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
                  interfaces: [
                    new GraphQLInterfaceType({
                      name: "StitchedInterface",
                      fields: {
                        id: {
                          type: new GraphQLNonNull(GraphQLID),
                        },
                      },
                    }),
                  ],
                }),
              },
            },
          }),
          rootValue,
          source: gql`
            query {
              fieldWithStitchedResolver {
                internalID
                ... on StitchedInterface {
                  internalID
                }
              }
            }
          `,
        })
        expect(data.fieldWithStitchedResolver.internalID).toEqual("db id")
      })

      it("does not throw when the nullable id field is a known non-gravity type", () => {
        expect(() => {
          createSchema({
            allowedNonGravityTypesWithNullableIDField: [
              "NullableID",
              "AnInterface",
            ],
            fields: {
              fieldWithNullableID: {
                type: new GraphQLObjectType({
                  name: "NullableID",
                  fields: {
                    ...NullableIDField,
                  },
                  interfaces: [
                    new GraphQLInterfaceType({
                      name: "AnInterface",
                      fields: {
                        ...NullableIDField,
                      },
                    }),
                  ],
                }),
              },
            },
          })
        }).not.toThrow()
      })

      it("renames nullable id field to internalID", async () => {
        const rootValue = {
          fieldWithNonGravityResolver: {
            id: null,
          },
        }
        const data = await runQueryOrThrow({
          schema: createSchema({
            allowedNonGravityTypesWithNullableIDField: [
              "NonGravityType",
              "AnInterface",
            ],
            fields: {
              fieldWithNonGravityResolver: {
                type: new GraphQLObjectType({
                  name: "NonGravityType",
                  fields: {
                    ...NullableIDField,
                  },
                  interfaces: [
                    new GraphQLInterfaceType({
                      name: "AnInterface",
                      fields: {
                        ...NullableIDField,
                      },
                    }),
                  ],
                }),
              },
            },
          }),
          rootValue,
          source: gql`
            query {
              fieldWithNonGravityResolver {
                internalID
                ... on AnInterface {
                  internalID
                }
              }
            }
          `,
        })
        expect(data.fieldWithNonGravityResolver.internalID).toEqual(null)
      })
    })
  })
})
