// returns +1 if version_a is greater than version_b
// returns -1 if version_a is less than version_b
// returns +0 if version_a is exactly equal to version_b
//
// Examples
//
//   semver_compare("0.1.1", "0.0.2"); //  1
//   semver_compare("1.0.1", "0.0.2"); //  1
//   semver_compare("0.0.1", "1.0.2"); // -1
//   semver_compare("0.0.1", "0.1.2"); // -1
//   semver_compare("1.0.1", "1.0.1"); //  0
//
export function semver_compare(version_a: string, version_b: string) {
  const split_a = version_a.split(".").map(Number);
  const split_b = version_b.split(".").map(Number);

  const max_split_parts = Math.max(split_a.length, split_b.length);
  for (let i = 0; i < max_split_parts; i++) {
    const num_a = split_a[i] || 0;
    const num_b = split_b[i] || 0;

    if (num_a > num_b) return 1;
    if (num_a < num_b) return -1;
  }

  return 0;
}
