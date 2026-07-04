console.log("WAAREE ENVS:");
for (const key of Object.keys(process.env)) {
  if (key.includes("WAAREE")) {
    console.log(`  ${key}: ${process.env[key]}`);
  }
}
