import _ from 'lodash';
import { versionedImageUrl } from '../../../schema/image/versioned';

describe('Image', () => {
  describe('versionedImageUrl', () => {
    const image = {
      image_url: 'https://xxx.cloudfront.net/xxx/:version.jpg',
      image_versions: ['four_thirds'],
    };

    it('takes an image response with options and resizes it to crop', () => {
      versionedImageUrl(image, { version: 'four_thirds' })
        .should.equal('https://xxx.cloudfront.net/xxx/four_thirds.jpg');
    });

    describe('without image_url', () => {
      it('returns undefined', () => {
        _.isUndefined(versionedImageUrl({}, { version: 'four_thirds' }))
          .should.be.true();
      });
    });
  });
});
