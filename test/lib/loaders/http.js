/* eslint-disable max-len */

import cache from '../../../lib/cache';
import httpLoader from '../../../lib/loaders/http';

describe('Loaders', () => {
  describe('http', () => {
    describe('error', () => {
      it('propagates the error through rejection if the API rejects', () => {
        const api = sinon.stub()
          .returns(Promise.reject(new Error('Something went wrong')));

        const loader = httpLoader(api);

        return expect(loader.load('/foo/bar')).to.be.rejectedWith('Something went wrong');
      });
    });

    describe('success', () => {
      it('accepts an API function and returns a generic data loader for making cached HTTP requests', () => {
        const api = sinon.stub()
          .returns(Promise.resolve({
            body: {
              ok: true,
            },
          }));

        const loader = httpLoader(api);

        return loader
          .load('/my/cached/request')
          .then(data =>
            Promise.all([
              Promise.resolve(data),
              loader.load('/my/cached/request'),
              cache.get('/my/cached/request'),
            ])
          )
          .then(([data, memoized, cached]) => {
            expect(api.callCount).to.equal(1);
            expect(api.args[0][0]).to.equal('/my/cached/request');

            expect(data.ok).to.be(true);
            expect(memoized.ok).to.be(true);
            expect(cached.ok).to.be(true);
          });
      });
    });
  });
});
