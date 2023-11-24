import * as React from "react";

import * as Ink from "ink";

import { is_finite_value } from "../core/is_finite_value.js";

type Props<T extends BaseRow> = {
  data: Array<T>;
  columns: ColumnComponentMap<T>;
  columnGap?: number;
  fillColumn?: Column<T>;
  maxWidth?: Partial<{ [key in Column<T>]: number }>;
};

export function Table<T extends BaseRow>(props: Props<T>) {
  if (!props.data.length) {
    return (
      <Container>
        <Ink.Text dimColor>No data found.</Ink.Text>
      </Container>
    );
  }

  const sample_row = props.data[0];
  const RowColumnList = Object.keys(sample_row) as Array<Column<T>>;

  // walk data and discover max width for each column
  const max_col_width = {} as { [key in Column<T>]: number };

  for (const col of RowColumnList) {
    max_col_width[col] = 0;
  }

  for (const row of props.data) {
    for (const col of RowColumnList) {
      const row_col = row[col];
      max_col_width[col] = Math.max(String(row_col).length, max_col_width[col]);
      const maxWidth = props.maxWidth?.[col];
      if (is_finite_value(maxWidth)) {
        max_col_width[col] = Math.min(maxWidth - 1, max_col_width[col]);
      }
    }
  }

  const { stdout } = Ink.useStdout();
  const available_width = stdout.columns;
  const columnGap = is_finite_value(props.columnGap) ? props.columnGap : 2;
  const breathing_room = 0;

  if (props.fillColumn) {
    let remaining_space = available_width;

    for (const col of RowColumnList) {
      // skip fill column from calculation
      if (props.fillColumn === col) {
        continue;
      }

      remaining_space -= max_col_width[col];
    }

    // gap * col count
    remaining_space -= columnGap * (RowColumnList.length - 1);

    // remove some extra space
    remaining_space -= breathing_room;

    if (props.fillColumn) {
      max_col_width[props.fillColumn] = Math.min(
        max_col_width[props.fillColumn],
        remaining_space
      );
    }
  }

  // console.debug({ available_width, remaining_space, max_col_width });

  return (
    <Container>
      {props.data.map((row, i) => {
        return (
          <Ink.Box
            key={i}
            // borderStyle="round"
            flexDirection="row"
            columnGap={columnGap}
            width={available_width}
          >
            {RowColumnList.map((column) => {
              const ColumnComponent = props.columns[
                column
              ] as ColumnComponent<T>;

              return (
                <Ink.Box key={String(column)} width={max_col_width[column]}>
                  <ColumnComponent row={row} column={column} />
                </Ink.Box>
              );
            })}
          </Ink.Box>
        );
      })}
    </Container>
  );
}

function Container(props: { children: React.ReactNode }) {
  return (
    <Ink.Box flexDirection="column">
      <Ink.Box height={1} />
      {props.children}
      <Ink.Box height={1} />
    </Ink.Box>
  );
}

type BaseRow = Record<string, string | number>;

type Column<T extends BaseRow> = keyof T;

type ColumnComponent<T extends BaseRow> = (
  props: TableColumnProps<T>
) => React.ReactNode;

type ColumnComponentMap<T extends BaseRow> = Record<
  Column<T>,
  ColumnComponent<T>
>;

export type TableColumnProps<T extends BaseRow> = {
  row: T;
  column: keyof T;
};
