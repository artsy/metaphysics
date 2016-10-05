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
        expect(request.args[0][0]).to.equal('https://galaxy-production-herokuapp.com/foo/bar');
        expect(request.args[0][1]).to.eql({
          headers: {
            Accept: 'application/vnd.galaxy-admin+json',
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
        expect(foo).to.equal('bar');
      });
    });

    it('tries to parse the response when there is a String and resolves with it', () => {
      const request = sinon.stub().yields(null, {
        statusCode: 200,
        body: JSON.stringify({ foo: 'bar' }),
      });
      fetch.__Rewire__('request', request);

      return galaxy('foo/bar').then(({ body: { foo } }) => {
        expect(foo).to.equal('bar');
      });
    });

    it('rejects request errors', () => {
      const request = sinon.stub().yields(new Error('bad'));
      fetch.__Rewire__('request', request);

      return expect(galaxy('foo/bar')).to.be.rejectedWith('bad');
    });

    it('rejects API errors', () => {
      const request = sinon.stub().yields(null, { statusCode: 401, body: 'Unauthorized' });
      fetch.__Rewire__('request', request);

      return expect(galaxy('foo/bar')).to.be.rejectedWith('Unauthorized');
    });

    it('rejects parse errors', () => {
      const request = sinon.stub().yields(null, { statusCode: 200, body: 'not json' });
      fetch.__Rewire__('request', request);

      return expect(galaxy('foo/bar')).to.be.rejectedWith(/Unexpected token o/);
    });
  });
});
