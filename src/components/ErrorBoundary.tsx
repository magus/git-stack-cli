/* eslint-disable no-console */
import * as React from "react";

import * as Ink from "ink-cjs";

import { Exit } from "~/app/Exit";
import { FormatText } from "~/app/FormatText";
import { Store } from "~/app/Store";
import { colors } from "~/core/colors";

type Props = {
  children: React.ReactNode;
};

type State = {
  error: null | Error;
  component_stack: string;
};

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      error: null,
      component_stack: "",
    };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  override componentDidCatch(_error: Error, error_info: React.ErrorInfo) {
    let component_stack = error_info.componentStack;

    if (component_stack) {
      // remove first line of component_stack
      component_stack = component_stack.split("\n").slice(1).join("\n");
      this.setState({ component_stack }, async () => {
        await Exit.handle_exit({ code: 5, clear: false });
      });
    }
  }

  override render() {
    if (!this.state.error) {
      return this.props.children;
    }

    const message = this.state.error.message;

    return (
      <Ink.Box flexDirection="column" gap={0}>
        <Ink.Text color={colors.red}>
          <FormatText
            message="🚨 Unhandled error {message}"
            values={{
              message: <Ink.Text color={colors.gray}>{message}</Ink.Text>,
            }}
          />
        </Ink.Text>

        {this._render_verbose()}
      </Ink.Box>
    );
  }

  _render_verbose() {
    const store_state = Store.getState();

    if (store_state.argv.verbose) {
      return <Ink.Text color={colors.gray}>{this.state.component_stack}</Ink.Text>;
    }

    return (
      <Ink.Text color={colors.gray}>
        <FormatText message="Try again with `--verbose` to see more information." />
      </Ink.Text>
    );
  }
}
