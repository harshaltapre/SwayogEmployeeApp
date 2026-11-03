console.error(
  "Refusing to publish a synthetic latest.json. The production manifest must be generated from a signed APK by the release pipeline."
);
process.exit(1);