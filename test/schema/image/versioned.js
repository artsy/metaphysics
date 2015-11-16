import _ from 'lodash';
import Image from '../../../schema/image';
import { VersionedImageUrl } from '../../../schema/image/versioned';

describe('Image', () => {
  describe('VersionedImageUrl', () => {
    let image = {
      image_url: 'https://xxx.cloudfront.net/xxx/:version.jpg'
    };

    it('takes an image response with options and resizes it to crop', () => {
      VersionedImageUrl(image, { version: 'four_thirds' })
        .should.equal('https://xxx.cloudfront.net/xxx/four_thirds.jpg');
    });

    describe('without image_url', () => {
      it('returns undefined', () => {
        _.isUndefined(VersionedImageUrl({}, { version: 'four_thirds' }))
          .should.be.true();
      })
    });
  });
});
