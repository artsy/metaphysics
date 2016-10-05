let graphqlErrorHandler = null;

if (process.env.NEW_RELIC_LICENSE_KEY) {
  const newrelic = require('newrelic');
  graphqlErrorHandler = error => {
    newrelic.noticeError(error, { graphql: true });
    return { message: error.message };
  };
} else {
  graphqlErrorHandler = error => ({
    message: error.message,
    locations: error.locations,
    stack: error.stack,
  });
}

export default graphqlErrorHandler;
