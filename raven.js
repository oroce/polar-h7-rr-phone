const Raven = require('raven-js');
require('raven-js/plugins/react-native')(Raven);

Raven
  .config('https://de3b0322e791413ca3cf909840581553@sentry.io/110514', { release: RELEASE_ID })
  .install();

export default Raven;
