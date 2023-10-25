import chalk from "chalk";

// test();

export function url(value: string) {
  return chalk.bold.underline.blueBright(value);
}

export function cmd(value: string) {
  return chalk.bold.yellow(value);
}

export function test() {
  const PROP_LIST = [
    "reset", // Reset the current style.
    "bold", // Make the text bold.
    "dim", // Make the text have lower opacity.
    "italic", // Make the text italic. (Not widely supported)
    "underline", // Put a horizontal line below the text. (Not widely supported)
    "overline", // Put a horizontal line above the text. (Not widely supported)
    "inverse", // Invert background and foreground colors.
    "hidden", // Print the text but make it invisible.
    "strikethrough", // Puts a horizontal line through the center of the text. (Not widely supported)
    "visible", // Print the text only when Chalk has a color level above zero. Can be useful for things that are purely cosmetic.

    "black",
    "red",
    "green",
    "yellow",
    "blue",
    "magenta",
    "cyan",
    "white",
    "blackBright",
    "gray",
    "grey",
    "redBright",
    "greenBright",
    "yellowBright",
    "blueBright",
    "magentaBright",
    "cyanBright",
    "whiteBright",

    "bgBlack",
    "bgRed",
    "bgGreen",
    "bgYellow",
    "bgBlue",
    "bgMagenta",
    "bgCyan",
    "bgWhite",
    "bgBlackBright",
    "bgGray",
    "bgGrey",
    "bgRedBright",
    "bgGreenBright",
    "bgYellowBright",
    "bgBlueBright",
    "bgMagentaBright",
    "bgCyanBright",
    "bgWhiteBright",
  ] as const;

  for (const prop of PROP_LIST) {
    console.debug(chalk[prop](prop));
  }
}
