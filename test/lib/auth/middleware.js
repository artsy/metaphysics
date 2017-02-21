import * as middleware from '../../../lib/auth/middleware';

describe('auth middleware', () => {
  describe('#validArtsyEmail', () => {
    it('returns true for artsy accounts, false for anything else', () => {
      expect(middleware.validArtsyEmail('johndoe@artsymail.com')).toBeTruthy();
      expect(middleware.validArtsyEmail('johndoe@artsy.net')).toBeTruthy();
      expect(middleware.validArtsyEmail('johndoe@artsymail.net')).toBeFalsy();
      expect(middleware.validArtsyEmail('johndoe@something.net')).toBeFalsy();
      expect(middleware.validArtsyEmail('johndoe@artsy.com')).toBeFalsy();
      expect(middleware.validArtsyEmail('notanemail')).toBeFalsy();
    });
  });

  describe('#authenticateWithUser', () => {
    it('returns true for users with valid artsy accounts, false for anything else', () => {
      expect(middleware.authenticateWithUser({
        user: { email: 'john@artsymail.com' },
      })).toBeTruthy();

      expect(middleware.authenticateWithUser({})).toBeFalsy();
      expect(middleware.authenticateWithUser('garbage')).toBeFalsy();
    });

    it('checks if user is admin in production', () => {
      process.env.NODE_ENV = 'production';

      expect(middleware.authenticateWithUser({
        user: { email: 'john@artsymail.com', type: 'Admin' },
      })).toBeTruthy();

      expect(middleware.authenticateWithUser({
        user: { email: 'ellen@gmail.com' } },
      )).toBeFalsy();

      expect(middleware.authenticateWithUser({
        user: { email: 'john@artsymail.com', roles: ['user', 'admin'] },
      })).toBeTruthy();

      expect(middleware.authenticateWithUser({ user: {} })).toBeFalsy();

      process.env.NODE_NEV = 'test';
    });
  });

  describe('json request', () => {
    let next;

    beforeEach(() => {
      next = sinon.stub();
    });

    it('nexts', () => {
      middleware.authenticateOrLogin({ accepts: sinon.stub().returns('json') }, null, next);
      expect(next.called).toBeTruthy();
    });
  });
});
