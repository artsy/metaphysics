import gravity from '../../../lib/apis/gravity';

describe('APIs', () => {
  describe('gravity', () => {
    const fetch = gravity.__get__('fetch');

    beforeAll(() => gravity.__Rewire__('config', { GRAVITY_XAPP_TOKEN: 'secret' }));

    afterAll(() => gravity.__ResetDependency__('config'));

    afterEach(() => {
      fetch.__ResetDependency__('request');
    });

    it('makes a correct request to Gravity', () => {
      const request = sinon.stub().yields(null, { statusCode: 200, body: {} });
      fetch.__Rewire__('request', request);

      return gravity('foo/bar').then(() => {
        expect(request.args[0][0]).toBe('https://api.artsy.test/api/v1/foo/bar');
        expect(request.args[0][1]).toEqual({
          headers: { 'X-XAPP-TOKEN': 'secret' },
          method: 'GET',
          timeout: 5000,
        });
      });
    });

    it('resolves when there is a successful JSON response', () => {
      const request = sinon.stub().yields(null, { statusCode: 200, body: { foo: 'bar' } });
      fetch.__Rewire__('request', request);

      return gravity('foo/bar').then(({ body: { foo } }) => {
        expect(foo).toBe('bar');
      });
    });

    it('tries to parse the response when there is a String and resolves with it', () => {
      const request = sinon.stub().yields(null, {
        statusCode: 200,
        body: JSON.stringify({ foo: 'bar' }),
      });
      fetch.__Rewire__('request', request);

      return gravity('foo/bar').then(({ body: { foo } }) => {
        expect(foo).toBe('bar');
      });
    });

    it('rejects request errors', () => {
      const request = sinon.stub().yields(new Error('bad'));
      fetch.__Rewire__('request', request);

      return expectPromiseRejectionToMatch(gravity('foo/bar'), /bad/);
    });

    it('rejects API errors', () => {
      const request = sinon.stub().yields(null, { statusCode: 401, body: 'Unauthorized' });
      fetch.__Rewire__('request', request);

      return expectPromiseRejectionToMatch(gravity('foo/bar'), /Unauthorized/);
    });

    it('rejects parse errors', () => {
      const request = sinon.stub().yields(null, { statusCode: 200, body: 'not json' });
      fetch.__Rewire__('request', request);

      return expectPromiseRejectionToMatch(gravity('foo/bar'), /Unexpected token/);
    });
  });
});
