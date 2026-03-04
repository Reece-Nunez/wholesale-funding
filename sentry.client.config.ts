import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://37346b4e5895e8335937b47c07acbc1d@o4510760826765312.ingest.us.sentry.io/4510987345788928",

  // Set tracesSampleRate to 1.0 to capture 100% of transactions for tracing.
  // We recommend adjusting this value in production.
  tracesSampleRate: 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Capture Replay for 10% of all sessions, plus 100% of sessions with an error
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,

  integrations: [
    Sentry.replayIntegration(),
  ],

  // Filter out errors from third-party scripts (reCAPTCHA, analytics, etc.)
  beforeSend(event) {
    const frames = event.exception?.values?.[0]?.stacktrace?.frames || [];
    const isThirdPartyError = frames.some((frame) => {
      const filename = frame.filename || '';
      return (
        filename.includes('recaptcha') ||
        filename.includes('gstatic.com') ||
        filename.includes('google.com/recaptcha')
      );
    });

    if (isThirdPartyError) {
      return null; // Drop the event
    }

    return event;
  },
});
