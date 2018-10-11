import {
  GraphQLFieldConfig,
  GraphQLObjectType,
  GraphQLString,
  GraphQLInterfaceType,
  GraphQLInt,
  GraphQLSchema,
  graphql,
} from "graphql"
import gql from "lib/gql"
import {
  precariousField,
  GraphQLErrorType,
  GraphQLErrorInterfaceType,
} from "../errors/precariousField"

// const ErrorType = new GraphQLErrorType({
//   errorClass: Error,
//   toErrorData: (error: Error) => ({ message: error.message }),
//   interfaces: [ErrorInterfaceType],
//   name: "ErrorType",
//   fields: {
//     message: {
//       type: GraphQLString,
//     },
//   },
// })

const HTTPErrorInterfaceType = new GraphQLErrorInterfaceType({
  name: "HTTPError",
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

class CustomHTTPError extends HTTPError {
  public readonly requestID: string

  constructor(message: string, statusCode: number, requestID: string) {
    super(message, statusCode)
    this.requestID = requestID
    Error.captureStackTrace(this, this.constructor)
  }
}

const CustomHTTPErrorType = new GraphQLErrorType({
  errorClass: CustomHTTPError,
  toErrorData: (error: CustomHTTPError) => ({
    message: error.message,
    statusCode: error.statusCode,
    requestID: error.requestID,
  }),
  interfaces: [HTTPErrorInterfaceType],
  name: "CustomHTTPError",
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
      throw new CustomHTTPError("Oh noes", 401, "a-request-id")
    }
  },
}

const schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: "Query",
    fields: {
      ...precariousField("artist", [CustomHTTPErrorType], artistFieldWithError),
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
          __typename: "CustomHTTPError",
          message: "Oh noes",
        },
      })
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
          __typename: "CustomHTTPError",
          message: "Oh noes",
          statusCode: 401,
        },
      })
    })

    it("works using the exact error type", async () => {
      const result = await graphql(
        schema,
        gql`
          {
            artistOrError {
              __typename
              ... on CustomHTTPError {
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
          __typename: "CustomHTTPError",
          message: "Oh noes",
          statusCode: 401,
          requestID: "a-request-id",
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
            }
          }
        `,
        {},
        { succeed: false }
      )
      expect(result.data).toEqual({ artist: null })
    })
  })
})
