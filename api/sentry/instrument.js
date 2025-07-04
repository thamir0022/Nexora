// Import with `import * as Sentry from "@sentry/node"` if you are using ESM
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: "https://456fa62d1a374d9cc3ab8b5585a2647a@o4507185531256832.ingest.de.sentry.io/4509609554280528",

  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true,
  _experiments: { enableLogs: true },
});
