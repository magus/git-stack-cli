import crypto from "node:crypto";

export function short_id() {
  // wall-clock milliseconds
  const timestamp = BigInt(Date.now());

  // random int value between 0 and 2^RANDOM_BITS - 1
  const random = BigInt(crypto.randomInt(0, 1 << RANDOM_BITS));

  // concatenate timestamp (high bits) and random value
  const combined = (timestamp << BigInt(RANDOM_BITS)) | random;

  const id = encode(combined, ID_LENGTH);

  // console.debug({ id, timestamp, random, combined });
  return id;
}

// converting value into base based on available chars
function encode(value: bigint, length?: number) {
  let result = "";

  // avoid zero division
  if (value > 0n) {
    while (value > 0n) {
      // convert least significant digit
      const digit = to_number(value % BASE);
      result = CHARS[digit] + result;

      // drop the digit we just divided by
      value /= BASE;
    }
  }

  // left pad with 0 to guarantee chars
  if (length) {
    result = result.padStart(length, PAD);
  }

  return result;
}

function to_number(value: bigint) {
  if (value >= BigInt(Number.MIN_SAFE_INTEGER) && value <= BigInt(Number.MAX_SAFE_INTEGER)) {
    return Number(value);
  }

  throw new Error("BigInt value outside safe integer range");
}

// valid characters to use for the short id
// use only lowercase letters and numbers to avoid
// confusing file system issues with git branch names
const CHARS = "-0123456789_abcdefghijklmnopqrstuvwxyz".split("").sort().join("");
const PAD = CHARS[0];
const BASE = BigInt(CHARS.length);
// bits carried by each char log2(BASE) ≈ 5.32
const CHAR_BITS = Math.log2(to_number(BASE));

// javascript Date.now returns a Number that will overflow eventually
// 2^53 max integer, overflows in 2^53 milliseconds (285_616 years)
// (1n<<53n) / 1_000n / 60n / 60n / 24n / 365n ≈ 285616n
const TIMESTAMP_BITS = 53;

// collision probability for identical timestamps (milliseconds)
// ≈ 1 / 2^30 ≈ 1 / 1_073_741_824 (1.1 billion)
const RANDOM_BITS = 30;

const ID_BITS = TIMESTAMP_BITS + RANDOM_BITS;
const ID_LENGTH = Math.ceil(ID_BITS / CHAR_BITS);
