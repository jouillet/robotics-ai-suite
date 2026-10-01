// Registers a single catch-all route at /models/:slug. The model slug is not
// known at build time (models are listed dynamically from Hugging Face), so one
// route serves every model. ModelDetail reads its slug from the URL and fetches
// content at runtime.

const path = require('path');
const { normalizeUrl } = require('@docusaurus/utils');

module.exports = function modelRoutesPlugin(context) {
  const { baseUrl } = context.siteConfig;

  return {
    name: 'model-routes',

    async contentLoaded({ actions }) {
      const { addRoute } = actions;
      const component = path.resolve(
        __dirname,
        '..',
        'src',
        'components',
        'ModelDetail',
        'index.tsx',
      );

      addRoute({
        path: normalizeUrl([baseUrl, 'models', ':slug']),
        component,
        exact: true,
      });
    },
  };
};
