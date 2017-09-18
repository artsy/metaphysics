// @ts-check
// import { GraphQLString, GraphQLObjectType } from "graphql"

import type { GraphQLFieldConfig } from "graphql"
import { pageable } from "relay-cursor-paging"
import { connectionFromArraySlice, mutationWithClientMutationId } from "graphql-relay"

// import _ from "lodash"
// import gravity from "lib/loaders/legacy/gravity"
// import cached from "./fields/cached"
// import { artworkConnection } from "./artwork"
// import Artist, { artistConnection } from "./artist"
// import Image from "./image"
// import filterArtworks, { filterArtworksArgs } from "./filter_artworks"

import { queriedForFieldsOtherThanBlacklisted, parseRelayOptions } from "lib/helpers"
import { GravityIDFields, NodeInterface } from "../object_identification"
import { GraphQLObjectType, GraphQLString, GraphQLNonNull, GraphQLList, GraphQLInt, GraphQLSchema } from "graphql"

// https://github.com/graphql/express-graphql/blob/6d5344a1e7c7e9bc09ce199bfe6665a254344010/src/__tests__/http-test.js#L711-L778

// const UploadedFileType = new GraphQLObjectType({
//   name: "UploadedFile",
//   fields: {
//     originalname: { type: GraphQLString },
//     mimetype: { type: GraphQLString },
//   },
// })

// const TestMutationSchema = new GraphQLSchema({
//   query: new GraphQLObjectType({
//     name: "QueryRoot",
//     fields: {
//       test: { type: GraphQLString },
//     },
//   }),
//   mutation: new GraphQLObjectType({
//     name: "MutationRoot",
//     fields: {
//       uploadFile: {
//         type: UploadedFileType,
//         resolve(rootValue) {
//           // For this test demo, we're just returning the uploaded
//           // file directly, but presumably you might return a Promise
//           // to go store the file somewhere first.
//           debugger
//           return rootValue.request.file
//         },
//       },
//     },
//   }),
// })

// export default TestMutationSchema

// const imageMutation = mutationWithClientMutationId({
//   name: "IntroduceImage",
//   inputFields: {
//     imageName: {
//       type: new GraphQLNonNull(GraphQLString),
//     },
//   },
//   outputFields: {
//     newImageEdge: {
//       type: UploadedFileType,

//       resolve: (payload, args, options) => {
//         const file = options.rootValue.request.file
//         //write the image to you disk

//         // return uploadFile(file.buffer, filePath, filename).then(() => {
//         //   /* Find the offset for new edge*/
//         //   return Promise.all([
//         //     new myImages().getAll(),
//         //     new myImages().getById(payload.insertId),
//         //   ]).spread((allImages, newImage) => {
//         //     const newImageStr = JSON.stringify(newImage)
//         //     /* If edge is in list return index */
//         //     const offset = allImages.reduce((pre, ele, idx) => {
//         //       if (JSON.stringify(ele) === newImageStr) {
//         //         return idx
//         //       }
//         //       return pre
//         //     }, -1)

//         //     return {
//         //       cursor: offset !== -1 ? Relay.offsetToCursor(offset) : null,
//         //       node: newImage,
//         //     }
//         //   })
//         // })
//       },
//     },
//     User: {
//       type: UserType,
//       resolve: () => new myImages().getAll(),
//     },
//   },
//   mutateAndGetPayload: input => {
//     //break the names to array.
//     let imageName = input.imageName.substring(0, input.imageName.lastIndexOf("."))
//     const mimeType = input.imageName.substring(input.imageName.lastIndexOf("."))
//     //wirte the image to database
//     return new myImages().add(imageName).then(id => {
//       //prepare to wirte disk
//       return {
//         insertId: id,
//         imgNmae: imageName,
//       }
//     })
//   },
// })

// A simple schema which includes a mutation.
const UploadedFileType = new GraphQLObjectType({
  name: "UploadedFile",
  fields: {
    originalname: { type: GraphQLString },
    mimetype: { type: GraphQLString },
  },
})

// const TestMutationSchema = new GraphQLSchema({
//   query: new GraphQLObjectType({
//     name: "QueryRoot",
//     fields: {
//       test: { type: GraphQLString },
//     },
//   }),
//   mutation: new GraphQLObjectType({
//     name: "MutationRoot",
//     fields: {
//       uploadFile: {
//         type: UploadedFileType,
//         resolve(rootValue) {
//           // For this test demo, we're just returning the uploaded
//           // file directly, but presumably you might return a Promise
//           // to go store the file somewhere first.
//           console.log(rootValue.request)
//           return rootValue.request.file
//         },
//       },
//     },
//   }),
// })

export default {
  type: UploadedFileType,
  resolve(rootValue) {
    // For this test demo, we're just returning the uploaded
    // file directly, but presumably you might return a Promise
    // to go store the file somewhere first.
    console.log(rootValue.file)
    return rootValue.file
  },
}
