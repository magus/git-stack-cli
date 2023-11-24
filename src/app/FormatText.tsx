import * as React from "react";

import * as Ink from "ink";
import { FormattedMessage } from "react-intl";

type Props = {
  message: string;
  values: React.ComponentProps<typeof FormattedMessage>["values"];
  wrapper?: React.ReactNode;
};

export function FormatText(props: Props) {
  const wrapper = (props.wrapper as React.ReactElement) || <Ink.Text />;

  return (
    <FormattedMessage
      id="FormatText"
      defaultMessage={props.message}
      values={props.values}
    >
      {(chunks) => {
        return React.cloneElement(wrapper, {}, chunks);
      }}
    </FormattedMessage>
  );
}
