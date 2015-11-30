import sinon from 'sinon';
import gravity from '../../../lib/apis/gravity';

describe('APIs', () => {
  describe('gravity', () => {
    let fetch = gravity.__get__('fetch');

    before(() => gravity.__Rewire__('config', { GRAVITY_XAPP_TOKEN: 'secret' }));

    after(() => gravity.__ResetDependency__('config'));

    afterEach(() => {
      fetch.__ResetDependency__('request');
    });

    it('makes a correct request to Gravity', () => {
      let request = sinon.stub().yields(null, { statusCode: 200, body: {} });
      fetch.__Rewire__('request', request);

      return gravity('foo/bar').then(data => {
        request.args[0][0].should.equal('https://api.artsy.test/api/v1/foo/bar');
        request.args[0][1].should.eql({
          headers: { 'X-XAPP-TOKEN': 'secret' },
          method: 'GET',
          timeout: 5000
        });
      });
    });

    it('resolves when there is a successful JSON response', () => {
      let request = sinon.stub().yields(null, { statusCode: 200, body: { foo: 'bar' } });
      fetch.__Rewire__('request', request);

      return gravity('foo/bar').then(data => {
        data.foo.should.equal('bar');
      });
    });

    it('tries to parse the response when there is a String and resolves with it', () => {
      let request = sinon.stub().yields(null, { statusCode: 200, body: JSON.stringify({ foo: 'bar' }) });
      fetch.__Rewire__('request', request);

      return gravity('foo/bar').then(data => {
        data.foo.should.equal('bar');
      });
    });

    it('rejects request errors', () => {
      let request = sinon.stub().yields(new Error('bad'));
      fetch.__Rewire__('request', request);

      return gravity('foo/bar').should.be.rejectedWith('bad');
    });

    it('rejects API errors', () => {
      let request = sinon.stub().yields(null, { statusCode: 401, body: 'Unauthorized' });
      fetch.__Rewire__('request', request);

      return gravity('foo/bar').should.be.rejectedWith('Unauthorized');
    });

    it('rejects parse errors', () => {
      let request = sinon.stub().yields(null, { statusCode: 200, body: 'not json' });
      fetch.__Rewire__('request', request);

      return gravity('foo/bar').should.be.rejectedWith('Unexpected token o');
    });
  });
});
