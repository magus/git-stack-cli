import crypto from "node:crypto";

export function short_id() {
  const timestamp = Date.now();

  // 9 223 372 036 854 775 808
  // 9 trillion possible values
  // (2^53) * (2^10) = 2^63 = 9,223,372,036,854,775,808
  const js_max_bits = 53;

  const timestamp_bits = Math.floor(Math.log2(timestamp)) + 1;

  // padding needed to reach 53 bits
  const padding_bits = js_max_bits - timestamp_bits;

  // random between 0 and 2^padding_bits - 1
  const random = crypto.randomInt(0, Math.pow(2, padding_bits));

  // combine timestamp and random value
  const combined = interleave_bits(timestamp, random);

  // console.debug({ combined, timestamp, random, padding_bits, timestamp_bits });

  return encode(combined);
}

function binary(value: number) {
  return BigInt(value).toString(2);
}

function rand_index(list: Array<any>) {
  return Math.floor(Math.random() * list.length);
}

function interleave_bits(a: number, b: number) {
  const a_binary = binary(a).split("");

  const b_binary = binary(b).split("");

  while (b_binary.length) {
    // pull random bit out of b_binary

    const b_index = rand_index(b_binary);

    const [selected] = b_binary.splice(b_index, 1);

    // insert random bit into a_binary

    const a_index = rand_index(a_binary);

    a_binary.splice(a_index, 0, selected);
  }

  // convert binary list back to integer

  const a_value = parseInt(a_binary.join(""), 2);

  return a_value;
}

function encode(value: number) {
  // base64 encode (64 characters)
  // max character necessary to encode is equal to maximum number
  // of bits in value divided by bits per character in encoding
  //
  // Example
  //   in base64 each characters can represent 6 bits (2^6 = 64)
  //   53 bits / 6 bits = 8.833333333333334 characters (9 characters)
  //
  // prettier-ignore
  const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-+";

  const bits_per_char = Math.log2(chars.length);
  const max_value_bits = 53;
  const max_char_size = Math.ceil(max_value_bits / bits_per_char);

  let result = "";

  while (value > 0) {
    result = chars[value % chars.length] + result;

    value = Math.floor(value / chars.length);
  }

  // pad the result to necessary characters
  return result.padStart(max_char_size, "=");
}
