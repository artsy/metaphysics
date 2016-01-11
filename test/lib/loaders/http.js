/* eslint-disable max-len */

import sinon from 'sinon';
import cache from '../../../lib/cache';
import httpLoader from '../../../lib/loaders/http';

describe('Loaders', () => {
  describe('http', () => {
    describe('error', () => {
      it('propagates the error through rejection if the API rejects', () => {
        const api = sinon.stub().returns(Promise.reject(new Error('Something went wrong')));
        const loader = httpLoader(api);
        return loader.load('/foo/bar').should.be.rejectedWith('Something went wrong');
      });
    });

    describe('success', () => {
      it('accepts an API function and returns a generic data loader for making cached HTTP requests', () => {
        const api = sinon.stub().returns(Promise.resolve({ ok: true }));
        const loader = httpLoader(api);

        return loader.load('/my/cached/request')
          .then(data => {
            return Promise.all([
              Promise.resolve(data),
              loader.load('/my/cached/request'),
              cache.get('/my/cached/request'),
            ]);
          })
          .then(([data, memoized, cached]) => {
            api.callCount.should.equal(1);
            api.args[0][0].should.equal('/my/cached/request');

            data.ok.should.be.true();
            memoized.ok.should.be.true();
            cached.ok.should.be.true();
          });
      });
    });
  });
});
