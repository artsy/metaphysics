const fetch = require("node-fetch")
const fs = require("fs")
var FormData = require("form-data")

const go = async () => {
  // const response = await request
  //   .post("http://localhost:5001/")
  //   .field(
  //     "query",
  //     `mutation TestMutation {
  //       uploadFile { originalname, mimetype }
  //      }`
  //   )
  //   .attach("file", __filename)
  var form = new FormData()
  // // JSON.stringify({
  // //   query: `mutation TestMutation {
  // //             uploadFile { originalname, mimetype }
  // //            }`,
  // // })
  form.append(
    "query",
    `mutation {
       uploadFile {
        originalname
      }
    }
  `
  )
  form.append("file", fs.createReadStream(__filename))

  console.log(form)
  // multipart/form-data
  const response = await fetch("http://localhost:5001/", {
    method: "POST",
    headers: {
      // "Content-Type": "multipart/form-data",
      // "X-USER-ID": Emission.userID,
      // "X-ACCESS-TOKEN": Emission.authenticationToken,
    },
    body: form,
    // body: JSON.stringify({
    //   query: `mutation TestMutation {
    //     uploadFile { originalname, mimetype }
    //     }`,
    // }),
  })

  const json = await response.json()
  console.log(json)
}

process.on("unhandledRejection", error => {
  // Will print "unhandledRejection err is not defined"
  console.log("unhandledRejection", error.message)
  console.error(error)
})

go()
