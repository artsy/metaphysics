import sinon from 'sinon';
import gravity from '../../../lib/apis/gravity';

describe('APIs', () => {
  describe('gravity', () => {
    let fetch = gravity.__get__('fetch');

    before(() => gravity.__Rewire__('GRAVITY_XAPP_TOKEN', 'secret'));

    after(() => gravity.__ResetDependency__('GRAVITY_XAPP_TOKEN'));

    afterEach(() => {
      fetch.__ResetDependency__('request');
    });

    it('makes a correct request to Gravity', (done) => {
      let request = sinon.stub().yields(null, {});
      fetch.__Rewire__('request', request);

      gravity('foo/bar')
        .then(data => {
          request.args[0][0].should.equal('https://api.artsy.test/api/v1/foo/bar');
          request.args[0][1].should.eql({ headers: { 'X-XAPP-TOKEN': 'secret' }, method: 'GET' });
        })
        .then(done)
        .catch(done);
    });

    it('resolves when there is a successful JSON response', (done) => {
      let request = sinon.stub().yields(null, { statusCode: 200, body: { foo: 'bar' } });
      fetch.__Rewire__('request', request);

      gravity('foo/bar')
        .then(data => {
          data.foo.should.equal('bar');
        })
        .then(done)
        .catch(done);
    });

    it('tries to parse the response when there is a String and resolves with it', (done) => {
      let request = sinon.stub().yields(null, { statusCode: 200, body: JSON.stringify({ foo: 'bar' }) });
      fetch.__Rewire__('request', request);

      gravity('foo/bar')
        .then(data => {
          data.foo.should.equal('bar');
        })
        .then(done)
        .catch(done);
    });

    it('rejects request errors', (done) => {
      let request = sinon.stub().yields(new Error('bad'));
      fetch.__Rewire__('request', request);

      gravity('foo/bar')
        .then(() => {
          true.should.be.false(); // Doesn't execute
        })
        .catch((err) => {
          err.message.should.equal('bad');
          done()
        });
    });

    it('rejects API errors', (done) => {
      let request = sinon.stub().yields(null, { statusCode: 401, body: 'Unauthorized' });
      fetch.__Rewire__('request', request);

      gravity('foo/bar')
        .then(() => {
          true.should.be.false(); // Doesn't execute
        })
        .catch((err) => {
          err.should.equal('Unauthorized');
          done()
        });
    });

    it('rejects parse errors', (done) => {
      let request = sinon.stub().yields(null, { statusCode: 200, body: 'not json' });
      fetch.__Rewire__('request', request);

      gravity('foo/bar')
        .catch((err) => {
          err.message.should.equal('Unexpected token o');
          done()
        });
    });
  });
});
