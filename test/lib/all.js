import all from '../../lib/all';

describe('all', () => {
  afterEach(() => {
    all.__ResetDependency__('total');
    all.__ResetDependency__('gravity');
  });

  it('fans out all the request', () => {
    const gravity = sinon.stub();

    all.__Rewire__('total', sinon.stub().returns(Promise.resolve(120)));
    all.__Rewire__('gravity', gravity.returns(Promise.resolve([{}])));

    return all(`artist/foo-bar/artworks`, { size: 10 })
      .then(artworks => {
        expect(gravity.args).toEqual([
          ['artist/foo-bar/artworks', { size: 10, page: 1 }],
          ['artist/foo-bar/artworks', { size: 10, page: 2 }],
          ['artist/foo-bar/artworks', { size: 10, page: 3 }],
          ['artist/foo-bar/artworks', { size: 10, page: 4 }],
          ['artist/foo-bar/artworks', { size: 10, page: 5 }],
          ['artist/foo-bar/artworks', { size: 10, page: 6 }],
          ['artist/foo-bar/artworks', { size: 10, page: 7 }],
          ['artist/foo-bar/artworks', { size: 10, page: 8 }],
          ['artist/foo-bar/artworks', { size: 10, page: 9 }],
          ['artist/foo-bar/artworks', { size: 10, page: 10 }],
          ['artist/foo-bar/artworks', { size: 10, page: 11 }],
          ['artist/foo-bar/artworks', { size: 10, page: 12 }],
        ]);

        expect(artworks.length).toBe(12); // 12 pages
      });
  });
});
