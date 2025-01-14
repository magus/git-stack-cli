import chalk from "chalk";

type ChalkInstance = typeof chalk;

interface ColorProxy extends ChalkInstance {
  test(): void;
  bracket(str: string): string;
  url(str: string): this;
  cmd(str: string): this;
  branch(str: string): this;
}

function create_color_proxy(base: typeof chalk): ColorProxy {
  return new Proxy(base as ColorProxy, {
    get(target, prop: keyof ColorProxy) {
      switch (prop) {
        case "test":
          return test;

        case "bracket":
          return (str: string) =>
            [target.bold.whiteBright("["), str, target.bold.whiteBright("]")].join("");

        case "url":
          return target.bold.underline.blueBright;
        case "cmd":
          return target.bold.yellow;
        case "branch":
          return target.bold.green;
      }

      const target_prop = target[prop];

      return target_prop;
    },
    apply(target, _this_arg, arguments_list) {
      return target(...arguments_list);
    },
  });
}
export const color = create_color_proxy(chalk);

function test() {
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
    // eslint-disable-next-line no-console
    console.debug(chalk[prop](prop));
  }
}
