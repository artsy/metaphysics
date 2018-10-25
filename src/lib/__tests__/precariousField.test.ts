import {
  GraphQLFieldConfig,
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLSchema,
  graphql,
} from "graphql"
import gql from "lib/gql"
import {
  precariousField,
  GraphQLErrorType,
  GraphQLErrorInterfaceType,
  GraphQLBaseErrorInterfaceType,
} from "lib/precariousField"

const ErrorInterfaceType = new GraphQLBaseErrorInterfaceType({
  name: "Error",
  fields: {
    message: {
      type: GraphQLString,
    },
  },
})

const HTTPErrorInterfaceType = new GraphQLErrorInterfaceType({
  name: "HTTPError",
  extendsInterface: ErrorInterfaceType,
  fields: {
    statusCode: {
      type: GraphQLInt,
    },
  },
})

class HTTPError extends Error {
  public readonly statusCode: number

  constructor(message: string, statusCode: number) {
    super(message)
    this.statusCode = statusCode
    Error.captureStackTrace(this, this.constructor)
  }
}

class HTTPWithRequestIDError extends HTTPError {
  public readonly requestID: string

  constructor(message: string, statusCode: number, requestID: string) {
    super(message, statusCode)
    this.requestID = requestID
    Error.captureStackTrace(this, this.constructor)
  }
}

const HTTPWithRequestIDErrorType = new GraphQLErrorType({
  errorClass: HTTPWithRequestIDError,
  errorInterface: HTTPErrorInterfaceType,
  toErrorData: error => ({
    message: error.message,
    statusCode: error.statusCode,
    requestID: error.requestID,
  }),
  // Test a non-thunk
  fields: {
    message: {
      type: GraphQLString,
    },
    statusCode: {
      type: GraphQLInt,
    },
    requestID: {
      type: GraphQLString,
    },
  },
})

const ArtistType = new GraphQLObjectType({
  name: "Artist",
  // Test a thunk
  fields: () => ({
    name: {
      type: GraphQLString,
    },
  }),
})

const artistFieldWithError: GraphQLFieldConfig<any, any, any> = {
  type: ArtistType,
  resolve: (_source, _args, context) => {
    if (context.succeed) {
      return { name: "picasso" }
    } else {
      if (context.unspecifiedError) {
        throw new Error("What is this?")
      } else {
        // Also testing an async resolver
        return Promise.resolve().then(() => {
          throw new HTTPWithRequestIDError("Oh noes", 401, "a-request-id")
        })
      }
    }
  },
}

const schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: "Query",
    fields: {
      ...precariousField({
        name: "artist",
        errors: [HTTPWithRequestIDErrorType],
        field: artistFieldWithError,
      }),
    },
  }),
})

describe("precariousField", () => {
  describe("concerning success", () => {
    it("works using the error field", async () => {
      const result = await graphql(
        schema,
        gql`
          {
            artistOrError {
              __typename
              ... on Artist {
                name
              }
            }
          }
        `,
        {},
        { succeed: true }
      )
      expect(result.data).toEqual({
        artistOrError: {
          __typename: "Artist",
          name: "picasso",
        },
      })
    })

    it("works using the nullable field", async () => {
      const result = await graphql(
        schema,
        gql`
          {
            artist {
              __typename
              ... on Artist {
                name
              }
            }
          }
        `,
        {},
        { succeed: true }
      )
      expect(result.data).toEqual({
        artist: {
          __typename: "Artist",
          name: "picasso",
        },
      })
    })
  })

  describe("concerning errors", () => {
    describe("when using the union field", () => {
      it("works using the standard error interface", async () => {
        const result = await graphql(
          schema,
          gql`
            {
              artistOrError {
                __typename
                ... on Error {
                  message
                }
              }
            }
          `,
          {},
          { succeed: false }
        )
        expect(result.data).toEqual({
          artistOrError: {
            __typename: "HTTPWithRequestIDError",
            message: "Oh noes",
          },
        })
        expect(result.errors).toBeUndefined()
      })

      it("works using the network error interface", async () => {
        const result = await graphql(
          schema,
          gql`
            {
              artistOrError {
                __typename
                ... on HTTPError {
                  message
                  statusCode
                }
              }
            }
          `,
          {},
          { succeed: false }
        )
        expect(result.data).toEqual({
          artistOrError: {
            __typename: "HTTPWithRequestIDError",
            message: "Oh noes",
            statusCode: 401,
          },
        })
        expect(result.errors).toBeUndefined()
      })

      it("works using the exact error type", async () => {
        const result = await graphql(
          schema,
          gql`
            {
              artistOrError {
                __typename
                ... on HTTPWithRequestIDError {
                  message
                  statusCode
                  requestID
                }
              }
            }
          `,
          {},
          { succeed: false }
        )
        expect(result.data).toEqual({
          artistOrError: {
            __typename: "HTTPWithRequestIDError",
            message: "Oh noes",
            statusCode: 401,
            requestID: "a-request-id",
          },
        })
        expect(result.errors).toBeUndefined()
      })

      it("does not catch unspecified errors", async () => {
        const result = await graphql(
          schema,
          gql`
            {
              artistOrError {
                __typename
              }
            }
          `,
          {},
          { succeed: false, unspecifiedError: true }
        )
        expect(result.data).toEqual({ artistOrError: null })
        expect(result.errors && result.errors.length).toEqual(1)
      })
    })

    describe("when using the nullable field", () => {
      it("returns null", async () => {
        const result = await graphql(
          schema,
          gql`
            {
              artist {
                __typename
              }
            }
          `,
          {},
          { succeed: false }
        )
        expect(result.data).toEqual({ artist: null })
        expect(result.errors).toBeUndefined()
      })

      it("does not catch unspecified errors", async () => {
        const result = await graphql(
          schema,
          gql`
            {
              artist {
                __typename
              }
            }
          `,
          {},
          { succeed: false, unspecifiedError: true }
        )
        expect(result.data).toEqual({ artist: null })
        expect(result.errors && result.errors.length).toEqual(1)
      })
    })
  })
})
