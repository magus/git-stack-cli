// simply check for flag set by `scripts/release-npm`
// ensure we are publishing through the custom script

if (!process.env.GS_RELEASE_NPM) {
  console.error("Must publish using `pnpm run release:npm`");
  console.error();
  process.exit(10);
}
