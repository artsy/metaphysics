import request from 'request';
import passport from 'passport';
import OAuth2Strategy from 'passport-oauth2';
import { authenticateOrLogin, localUser } from './middleware';

const {
  GRAVITY_API_URL,
  ARTSY_ID,
  ARTSY_SECRET,
  APP_URL
} = process.env;

const strategy = new OAuth2Strategy({
  authorizationURL: GRAVITY_API_URL + '/oauth2/authorize',
  tokenURL: GRAVITY_API_URL + '/oauth2/access_token',
  clientID: ARTSY_ID,
  clientSecret: ARTSY_SECRET,
  callbackURL: '/auth/artsy/callback'
}, (accessToken, refreshToken, profile, done) => {
  request({
    url: GRAVITY_API_URL + '/api/v1/me',
    headers: { 'X-Access-Token': accessToken }
  }, (err, res, body) => {
    done(null, JSON.parse(body));
  })
});

passport.use('artsy', strategy);
passport.serializeUser((token, done) => done(null, { token }));
passport.deserializeUser((user, done) => done(null, user));

export default app => {
  app.use(passport.initialize());
  app.use(passport.session());

  app.get('/login', passport.authenticate('artsy'));
  app.get('/auth/artsy/callback', passport.authenticate('artsy', {
    successRedirect: '/',
    failureRedirect: '/logout'
  }), (req, res) => {
    res.redirect('/');
  });
  app.get('/logout', (req, res) => {
    req.logout();
    res.redirect(GRAVITY_API_URL + '/users/sign_out');
  });

  app.use(authenticateOrLogin);
  app.use(localUser);
}