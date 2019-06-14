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
} from "schema/object_identification"
import {
  GraphQLSchema,
  GraphQLObjectType,
  graphql,
  GraphQLFieldConfigMap,
  GraphQLNonNull,
  GraphQLID,
  GraphQLInterfaceType,
  GraphQLArgs,
  GraphQLString,
} from "graphql"
import gql from "lib/gql"
import { toGlobalId } from "graphql-relay"
import {
  ExecutionResultDataDefault,
  ExecutionResult,
} from "graphql/execution/execute"
import { deprecate } from "lib/deprecation"

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

async function runQuery<TData = ExecutionResultDataDefault>(
  args: GraphQLArgs
): Promise<ExecutionResult<TData>> {
  const res = await graphql<TData>(args)
  if (res.errors) {
    throw new Error(res.errors.map(e => e.message).join("\n"))
  }
  return res
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
                thisIsJustSoGetRidOfIDExists: {
                  type: GraphQLString,
                },
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

  describe("concerning ID renaming", () => {
    it("renames __id arg to id", async () => {
      const rootValue = {
        node: {
          id: "global id",
        },
      }
      const iface = new GraphQLInterfaceType({
        name: "Node",
        fields: {
          __id: GlobalIDField,
        },
        resolveType: () => "AnyType",
      })
      const AnyType = new GraphQLObjectType({
        name: "AnyType",
        fields: {
          __id: GlobalIDField,
        },
        interfaces: () => [iface],
      })
      const { data } = await runQuery({
        schema: createSchema({
          fields: {
            node: {
              type: iface,
              args: {
                __id: {
                  type: new GraphQLNonNull(GraphQLID),
                  description: "The ID of the object",
                },
              },
            },
            thisIsJustSoAnyTypeExists: {
              type: AnyType,
            },
          },
        }),
        rootValue,
        source: gql`
          query {
            node(id: "global id") {
              id
            }
          }
        `,
      })
      expect(data.node.id).toEqual(toGlobalId("AnyType", "global id"))
    })

    it("renames __id field to id", async () => {
      const rootValue = {
        fieldWithGlobalID: {
          id: "global id",
        },
      }
      const { data } = await runQuery({
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

    it.only("supports aliasing of a renamed field", async () => {
      const rootValue = {
        fieldWithGlobalID: {
          id: "global id",
        },
      }
      const { data } = await runQuery({
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
              # id
              someOtherName: id
            }
          }
        `,
      })
      expect(data.fieldWithGlobalID.someOtherName).toEqual(
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
      it("renames id field to gravityID", async () => {
        const rootValue = {
          fieldWithGravityResolver: {
            id: "slug or id",
          },
        }
        const { data } = await runQuery({
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
                gravityID
                ... on AnInterface {
                  gravityID
                }
              }
            }
          `,
        })
        expect(data.fieldWithGravityResolver.gravityID).toEqual("slug or id")
      })

      it("renames _id field to internalID", async () => {
        const rootValue = {
          fieldWithGravityResolver: {
            _id: "mongo id",
          },
        }
        const { data } = await runQuery({
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
        const { data } = await runQuery({
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
        const { data } = await runQuery({
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
        const { data } = await runQuery({
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
