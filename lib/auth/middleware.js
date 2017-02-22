export function validArtsyEmail(email) {
  return /@artsymail.com$/.test(email) || /@artsy.net$/.test(email);
}

export function isUserAdmin(user) {
  return user.type === 'Admin' || user.roles.indexOf('admin') !== -1;
}

export function isAuthable(req) {
  return req.accepts(['json', 'html']) === 'html';
}

export function authenticateWithUser(req) {
  const { NODE_ENV } = process.env;

  if (NODE_ENV === 'production') {
    return !!req.user
      && validArtsyEmail(req.user.email)
      && isUserAdmin(req.user);
  }

  return !!req.user;
}

export function authenticateOrLogin(req, res, next) {
  if (!isAuthable(req)) {
    return next();
  }

  if (authenticateWithUser(req)) {
    return next();
  }

  res.redirect('/login');
}
