export default function graphqlErrorHandler(query) {
  if (process.env.NEW_RELIC_LICENSE_KEY) {
    const newrelic = require('newrelic');
    return error => {
      const artworkNotFound = /Artwork Not Found/.test(error.message);
      if (!artworkNotFound && (error.statusCode === undefined || error.statusCode >= 500)) {
        newrelic.noticeError(error, query);
      }
      return { message: error.message };
    };
  }
  return error => ({
    message: error.message,
    locations: error.locations,
    stack: error.stack,
  });
}
