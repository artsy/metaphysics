import basicAuth from 'basic-auth';

const {
  NODE_ENV,
  BASIC_AUTH_USERNAME,
  BASIC_AUTH_PASSWORD,
} = process.env;

function isAuthable(req) {
  return req.accepts(['json', 'html']) === 'html';
}

function isDevelopment() {
  return NODE_ENV === 'development';
}

function isValidUser({ name, pass }) {
  return name === BASIC_AUTH_USERNAME && pass === BASIC_AUTH_PASSWORD;
}

function unauthorized(res) {
  res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
  return res.send(401);
}

export default (req, res, next) => {
  if (isDevelopment()) return next();

  if (!isAuthable(req)) return next();

  const user = basicAuth(req);
  if (!user || !user.name || !user.pass) return unauthorized(res);

  if (isValidUser(user)) return next();

  return unauthorized(res);
};
