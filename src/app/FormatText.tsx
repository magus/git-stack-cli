import * as React from "react";

import { FormattedMessage } from "react-intl";

type Props = {
  message: string;
  values: React.ComponentProps<typeof FormattedMessage>["values"];
  wrapper?: React.ReactNode;
};

export function FormatText(props: Props) {
  return (
    <FormattedMessage id="FormatText" defaultMessage={props.message} values={props.values}>
      {(chunks) => {
        return React.cloneElement(props.wrapper as React.ReactElement, {}, chunks);
      }}
    </FormattedMessage>
  );
}
