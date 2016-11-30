import auth from '../../lib/auth';

describe('auth middleware', () => {
  let res;
  let next;

  beforeEach(() => {
    next = sinon.stub();
    res = {
      set: sinon.stub(),
      send: sinon.stub(),
    };
  });

  describe('development environment', () => {
    beforeAll(() => {
      auth.__Rewire__('isDevelopment', () => true);
    });

    afterAll(() => {
      auth.__ResetDependency__('isDevelopment');
    });

    it('nexts', () => {
      auth(null, null, next);

      expect(next.called).toBe(true);
    });
  });

  describe('json request', () => {
    it('nexts', () => {
      auth({ accepts: sinon.stub().returns('json') }, null, next);

      expect(next.called).toBe(true);
    });
  });

  describe('html request (GraphiQL)', () => {
    const req = { accepts: sinon.stub().returns('html') };

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

        expect(next.called).toBe(false);

        expect(res.set.args[0])
          .toEqual(['WWW-Authenticate', 'Basic realm=Authorization Required']);

        expect(res.send.args[0][0])
          .toBe(401);
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

        expect(next.called).toBe(true);
      });
    });
  });
});
