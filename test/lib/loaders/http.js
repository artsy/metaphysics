import sinon from 'sinon';
import cache from '../../../lib/cache';
import httpLoader from '../../../lib/loaders/http';

describe('Loaders', () => {
  describe('http', () => {
    it('accepts an API function and returns a generic data loader for making cached HTTP requests', (done) => {
      let api = sinon.stub().returns(Promise.resolve({ ok: true }));
      let loader = httpLoader(api);
      loader.load('/my/cached/request')
        .then(data => {
          Promise.all([
            loader.load('/my/cached/request'),
            cache.get('/my/cached/request')
          ]).then(([memoized, cached]) => {
            api.callCount.should.equal(1);
            api.args[0][0].should.equal('/my/cached/request');

            data.ok.should.be.true();
            memoized.ok.should.be.true();
            cached.ok.should.be.true();
            done();
          })
          .catch(done);
        })
        .catch(done);
    });
  });
});
