// NOTE: This type and file are deprecated, edit home_page_artwork_modules.js instead.
//       These should be removed in the future once Force has migrated to the new type.

import HomePageModule from './home_page_module';
import { createHomePageArtworkModules } from './home_page_artwork_modules';

const HomePageModules = createHomePageArtworkModules(HomePageModule);
export default HomePageModules;
