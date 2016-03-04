import { stub } from 'sinon';
import auth from '../../lib/auth';

describe('auth middleware', () => {
  let res;
  let next;

  beforeEach(() => {
    next = stub();
    res = {
      set: stub(),
      send: stub(),
    };
  });

  describe('development environment', () => {
    before(() => {
      auth.__Rewire__('isDevelopment', () => true);
    });

    after(() => {
      auth.__ResetDependency__('isDevelopment');
    });

    it('nexts', () => {
      auth(null, null, next);

      next.called.should.be.true();
    });
  });

  describe('json request', () => {
    it('nexts', () => {
      auth({ accepts: stub().returns('json') }, null, next);

      next.called.should.be.true();
    });
  });

  describe('html request (GraphiQL)', () => {
    const req = { accepts: stub().returns('html') };

    describe('invalid user/pass combo', () => {
      beforeEach(() => {
        auth.__Rewire__('basicAuth', () => ({
          name: 'wrong',
          pass: 'wrong',
        }));
      });

      afterEach(() => {
        auth.__ResetDependency__('basicAuth');
      });

      it('requires auth; 401s', () => {
        auth(req, res, next);

        next.called.should.be.false();

        res.set.args[0]
          .should.eql(['WWW-Authenticate', 'Basic realm=Authorization Required']);

        res.send.args[0][0]
          .should.equal(401);
      });
    });

    describe('valid user/pass combo', () => {
      beforeEach(() => {
        auth.__Rewire__('basicAuth', () => ({
          name: 'foo', // Set in .env.text
          pass: 'bar', // Set in .env.text
        }));
      });

      afterEach(() => {
        auth.__ResetDependency__('basicAuth');
      });

      it('nexts', () => {
        auth(req, res, next);

        next.called.should.be.true();
      });
    });
  });
});
