import * as React from "react";

import { IntlProvider } from "react-intl";

type Props = {
  children: React.ReactNode;
};

export function Providers(props: Props) {
  return <IntlProvider locale="en">{props.children}</IntlProvider>;
}
