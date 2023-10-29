import * as React from "react";

import * as Ink from "ink";

import { clamp } from "../core/clamp.js";

type Item<T> = {
  label: string;
  value: T;
};

type Props<T> = {
  items: Array<Item<T>>;
  onSelect(item: Item<T>, list: Array<Item<T>>): void;
};

export function MultiSelect<T>(props: Props<T>) {
  const [selected, select] = React.useReducer(
    (state: Set<number>, value: number) => {
      const next = new Set(state);

      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }

      return next;
    },
    new Set<number>(),
  );

  // clamp index to keep in item range
  const [index, set_index] = React.useReducer((_: any, value: number) => {
    return clamp(value, 0, props.items.length - 1);
  }, 0);

  React.useEffect(() => {
    const item = props.items[index];

    const selected_list = Array.from(selected);
    const list = selected_list.map((index) => props.items[index]);
    props.onSelect(item, list);
  }, [selected]);

  Ink.useInput((_input, key) => {
    if (key.return) {
      return select(index);
    }

    if (key.upArrow) {
      return set_index(index - 1);
    }

    if (key.downArrow) {
      return set_index(index + 1);
    }
  });

  return (
    <Ink.Box flexDirection="column">
      {props.items.map((item, i) => {
        const active = i === index;

        return (
          <ItemRow
            key={item.label}
            label={item.label}
            active={active}
            selected={selected.has(i)}
          />
        );
      })}
    </Ink.Box>
  );
}

type RadioProps = {
  selected: boolean;
};

function Radio(props: RadioProps) {
  let display;
  let color;

  if (props.selected) {
    display = "✓";
    color = "green";
  } else {
    display = " ";
    color = "";
  }

  return (
    <Ink.Text bold={props.selected} color={color}>
      {display}
    </Ink.Text>
  );
}

type ItemRowProps = {
  label: string;
  active: boolean;
  selected: boolean;
};

function ItemRow(props: ItemRowProps) {
  let color;
  let underline;

  if (props.active) {
    color = "#38bdf8";
    underline = true;
  } else if (props.selected) {
    color = "";
  } else {
    color = "gray";
  }

  return (
    <Ink.Box flexDirection="row" alignItems="center" gap={1}>
      <Radio selected={props.selected} />
      <Ink.Text bold={props.selected} underline={underline} color={color}>
        {props.label}
      </Ink.Text>
    </Ink.Box>
  );
}
