// Do not require the use of node-foreman during testing

import fs from "fs"
import dotenv from "dotenv"

if (fs.existsSync(".env.test")) {
  dotenv.config({ path: ".env.test" })
}

// Set up our globals
import sinon from "sinon"
global.sinon = sinon

// prettier-ignore

/**
 * Ensuring that promises fail is actually a little bit tricky,
 * see https://github.com/facebook/jest/issues/2129
 *
 * So until this is built into Jest, then this will do for now
 */

const expectPromiseRejectionToMatch = (promise, failureMessage) => {
  return new Promise((resolve, reject) => {
    promise
      .then(() => {
        const object = {
          message: "Expected this promise to fail",
        }
        return reject(object)
      })
      .catch(e => {
        expect(e.message).toMatch(failureMessage)
        return resolve({})
      })
  })
}

global.expectPromiseRejectionToMatch = expectPromiseRejectionToMatch

/**
 * We want to silence the console output from node-uuid, so we use a mocked module
 *  at __mocks__/node-uuid.js which has it's console muted
 * */
jest.mock("node-uuid")
