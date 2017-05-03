// Do not require the use of node-foreman during testing
import dotenv from "dotenv"
dotenv.config({ path: ".env.test" })

// Set up our globals
import sinon from "sinon"
global.sinon = sinon

/**
 * Ensuring that promises fail is actually a little bit tricky,
 * see https://github.com/facebook/jest/issues/2129
 *
 * So until this is built into Jest, then this will do for now 👍 */ global.expectPromiseRejectionToMatch = (
  promise,
  failureMessage
) => {
  return new Promise((resolve, reject) => {
    promise
      .then(() => {
        const object = {
          message: "Expected this promise to fail",
        }
        reject(object)
      })
      .catch(e => {
        expect(e.message).toMatch(failureMessage)
        resolve({})
      })
  })
} // We want to silence the console output from node-uuid, so we use a mocked module // // at __mocks__/node-uuid.js which has it's console muted
jest.mock("node-uuid")
