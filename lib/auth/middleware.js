export function validArtsyEmail(email) {
  return (/@artsymail.com$/.test(email) || /@artsy.net$/.test(email));
}

export function authenticateWithUser(req) {
  return (!!req.user && validArtsyEmail(req.user.email));
}

export function authenticateOrLogin(req, res, next) {
  if (authenticateWithUser(req)) {
    return next();
  }

  res.redirect('/login');
}

export function localUser(req, res, next) {
  res.locals.user = req.user;
  next();
}

