import sinon from 'sinon';
import gravity from '../../../lib/loaders/gravity';

describe('gravity', () => {
  afterEach(() => gravity.__ResetDependency__('gravity'));

  describe('with authentication', () => {
    it('loads the path and passes in the token', () => {
      const api = sinon.stub().returns(Promise.resolve({ body: { ok: true } }));
      gravity.__Rewire__('gravity', api);

      return Promise.all([
        gravity.with('xxx')('foo/bar', { ids: ['baz'] }),
        gravity.with('yyy')('foo/bar', { ids: ['baz'] }),
        gravity.with('zzz')('foo/bar', { ids: ['baz'] }),
      ])
        .then(responses => {
          api.args.should.eql([
            ['foo/bar?ids%5B%5D=baz', 'xxx'],
            ['foo/bar?ids%5B%5D=baz', 'yyy'],
            ['foo/bar?ids%5B%5D=baz', 'zzz'],
          ]);
          responses.should.eql([
            { ok: true },
            { ok: true },
            { ok: true },
          ]);
        });
    });
  });
});
