import * as React from "react";

import { colors } from "~/core/colors";

type RenderOptions = {
  color: string;
  name: string;
};

type Props = {
  children: (render_options: RenderOptions) => React.ReactNode;
};

export function ColorTest(props: Props) {
  return (
    <React.Fragment>
      {Object.entries(colors).map(([key, color]) => {
        const name = `colors:${key}`;
        return props.children({ color, name });
      })}

      {INK_COLORS.map((color) => {
        const name = `ink:${color}`;
        return props.children({ color, name });
      })}
    </React.Fragment>
  );
}

// ForegroundColor
// https://github.com/magus/git-stack-cli/blob/master/node_modules/.pnpm/chalk@5.3.0/node_modules/chalk/source/vendor/ansi-styles/index.d.ts#L75
const INK_COLORS = [
  "black",
  "red",
  "green",
  "yellow",
  "blue",
  "cyan",
  "magenta",
  "white",
  "blackBright",
  "redBright",
  "greenBright",
  "yellowBright",
  "blueBright",
  "cyanBright",
  "magentaBright",
  "whiteBright",
];
