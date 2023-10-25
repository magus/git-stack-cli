import chalk from "chalk";

// test();

type ChalkInstance = typeof chalk;

interface ColorProxy extends ChalkInstance {
  url(value: string): this;
  cmd(value: string): this;
}

function create_color_proxy(base: typeof chalk): ColorProxy {
  return new Proxy(chalk as any, {
    get(target, prop) {
      switch (prop) {
        case "url":
          return target.bold.underline.blueBright;
        case "cmd":
          return target.bold.yellow;
      }

      const target_prop = target[prop];

      return target_prop;
    },
    apply(target, this_arg, arguments_list) {
      return target(...arguments_list);
    },
  });
}
export const color = create_color_proxy(chalk);

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
