import sinon from 'sinon';
import gravity from '../../../lib/apis/gravity';

describe('APIs', () => {
  describe('gravity', () => {
    before(() => gravity.__Rewire__('ARTSY_XAPP_TOKEN', 'secret'));

    after(() => gravity.__ResetDependency__('ARTSY_XAPP_TOKEN'));

    afterEach(() => {
      gravity.__ResetDependency__('request');
    });

    it('makes a correct request to Gravity', (done) => {
      let request = sinon.stub().yields(null, {});
      gravity.__Rewire__('request', request);

      gravity('foo/bar')
        .then(data => {
          request.args[0][0].should.equal('https://api.artsy.test/api/v1/foo/bar');
          request.args[0][1].should.eql({ headers: { 'X-XAPP-TOKEN': 'secret' }, method: 'GET' });
        })
        .then(done)
        .catch(done);
    });

    it('resolves when there is a successful JSON response', (done) => {
      let request = sinon.stub().yields(null, { body: { foo: 'bar' } });
      gravity.__Rewire__('request', request);

      gravity('foo/bar')
        .then(data => {
          data.foo.should.equal('bar');
        })
        .then(done)
        .catch(done);
    });

    it('tries to parse the response when there is a String and resolves with it', (done) => {
      let request = sinon.stub().yields(null, { body: JSON.stringify({ foo: 'bar' }) });
      gravity.__Rewire__('request', request);

      gravity('foo/bar')
        .then(data => {
          data.foo.should.equal('bar');
        })
        .then(done)
        .catch(done);
    });

    it('rejects API errors', (done) => {
      let request = sinon.stub().yields(new Error('bad'));
      gravity.__Rewire__('request', request);

      gravity('foo/bar')
        .then(() => {
          true.should.be.false(); // Doesn't execute
        })
        .catch((err) => {
          err.message.should.equal('bad');
          done()
        });
    });

    it('rejects parse errors', (done) => {
      let request = sinon.stub().yields(null, { body: 'not json'});
      gravity.__Rewire__('request', request);

      gravity('foo/bar')
        .catch((err) => {
          err.message.should.equal('Unexpected token o');
          done()
        });
    });
  });
});
