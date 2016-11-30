import galaxy from '../../../lib/apis/galaxy';

describe('APIs', () => {
  describe('galaxy', () => {
    const fetch = galaxy.__get__('fetch');

    afterEach(() => {
      fetch.__ResetDependency__('request');
    });

    it('makes a correct request to galaxy', () => {
      const request = sinon.stub().yields(null, { statusCode: 200, body: {} });
      fetch.__Rewire__('request', request);

      return galaxy('foo/bar').then(() => {
        expect(request.args[0][0]).toBe('https://galaxy-staging-herokuapp.com/foo/bar');
        expect(request.args[0][1]).toEqual({
          headers: {
            Accept: 'application/vnd.galaxy-public+json',
            'Content-Type': 'application/hal+json',
            'Http-Authorization': 'galaxy_token',
          },
          method: 'GET',
          timeout: 5000,
        });
      });
    });

    it('resolves when there is a successful JSON response', () => {
      const request = sinon.stub().yields(null, { statusCode: 200, body: { foo: 'bar' } });
      fetch.__Rewire__('request', request);

      return galaxy('foo/bar').then(({ body: { foo } }) => {
        expect(foo).toBe('bar');
      });
    });

    it('tries to parse the response when there is a String and resolves with it', () => {
      const request = sinon.stub().yields(null, {
        statusCode: 200,
        body: JSON.stringify({ foo: 'bar' }),
      });
      fetch.__Rewire__('request', request);

      return galaxy('foo/bar').then(({ body: { foo } }) => {
        expect(foo).toBe('bar');
      });
    });

    it('rejects request errors', () => {
      const request = sinon.stub().yields(new Error('bad'));
      fetch.__Rewire__('request', request);
      return expectPromiseRejectionToMatch(galaxy('foo/bar'), /bad/);
    });

    it('rejects API errors', () => {
      const request = sinon.stub().yields(null, { statusCode: 400, body: 'Unauthorized' });
      fetch.__Rewire__('request', request);

      return expectPromiseRejectionToMatch(galaxy('foo/bar'), 'Unauthorized');
    });

    it('rejects parse errors', () => {
      const request = sinon.stub().yields(null, { statusCode: 200, body: 'not json' });
      fetch.__Rewire__('request', request);

      return expectPromiseRejectionToMatch(galaxy('foo/bar'), /Unexpected token/);
    });
  });
});
