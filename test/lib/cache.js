import cache from '../../lib/cache';

describe('Cache', () => {
  describe('when connection to Redis fails', () => {
    beforeAll(() => {
      cache.__Rewire__('client', {
        get: (key, cb) => cb(new Error('connect ECONNREFUSED')),
      });
    });

    afterAll(() => {
      cache.__ResetDependency__('client');
    });

    describe('#get', () => {
      it('falls through with a rejection', () => {
        return cache.get('foobar').catch(e => {
          expect(e.message).toEqual('connect ECONNREFUSED');
        });
      });
    });
  });

  describe('when successfully connected to the cache', () => {
    const client = cache.__get__('client');

    afterEach(() => {
      client.store = {};
    });

    describe('#get', () => {
      beforeEach(() => cache.set('get_foo', { bar: 'baz' }));

      it('parses the data and resolves the promise', () => {
        return cache.get('get_foo').then(data => {
          expect(data.bar).toBe('baz');
        });
      });
    });

    describe('#set', () => {
      describe('with a plain Object', () => {
        it('sets the cache and includes a timestamp', (done) => {
          cache.set('set_foo', { bar: 'baz' });

          client.get('set_foo', (err, data) => {
            const parsed = JSON.parse(data);

            expect(parsed.bar).toBe('baz');
            expect(typeof parsed.cached).toBe('number');

            done();
          });
        });
      });

      describe('with an Array', () => {
        it('sets the cache and includes a timestamp', (done) => {
          cache.set('set_bar', [{ baz: 'qux' }]);

          client.get('set_bar', (err, data) => {
            const parsed = JSON.parse(data);

            expect(parsed.length).toBe(1);
            expect(parsed[0].baz).toBe('qux');
            expect(typeof parsed[0].cached).toBe('number');

            done();
          });
        });
      });
    });
  });
});
