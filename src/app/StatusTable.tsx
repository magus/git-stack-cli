import * as React from "react";

import * as Ink from "ink";

import { assertNever } from "../core/assertNever.js";
import { invariant } from "../core/invariant.js";
import { is_finite_value } from "../core/is_finite_value.js";

import { Store } from "./Store.js";
import { Url } from "./Url.js";

export function StatusTable() {
  const commit_range = Store.useState((state) => state.commit_range);

  invariant(commit_range, "commit_range must exist");

  const row_list = [];

  for (const group of commit_range.group_list) {
    const row: Row = {
      icon: "",
      count: "",
      status: "NEW",
      title: "",
      url: "",
    };

    if (group.id === commit_range.UNASSIGNED) {
      row.icon = "⭑";
      row.status = "NEW";
      row.title = "Unassigned";
      row.count = `0/${group.commits.length}`;
      row.url = "";
    } else {
      if (group.dirty) {
        row.icon = "!";
        row.status = "OUTDATED";
      } else {
        row.icon = "✔";
        row.status = "SYNCED";
      }

      if (group.pr) {
        if (group.pr.state === "MERGED") {
          row.icon = "↗";
          row.status = "MERGED";
        }

        row.title = group.pr.title;
        row.count = `${group.pr.commits.length}/${group.commits.length}`;
        row.url = group.pr.url;
      } else {
        row.title = group.title || group.id;
        row.count = `0/${group.commits.length}`;
      }
    }

    row_list.push(row);
  }

  return (
    <Table
      data={row_list}
      fillColumn="title"
      // maxWidth={{
      //   title: 30,
      // }}
      columnGap={3}
      columns={{
        icon: IconColumn,
        status: StatusColumn,
        count: CountColumn,
        title: TitleColumn,
        url: UrlColumn,
      }}
    />
  );
}

type Props<T extends BaseRow> = {
  data: Array<T>;
  columns: ColumnComponentMap<T>;
  columnGap?: number;
  fillColumn?: Column<T>;
  maxWidth?: Partial<{ [key in Column<T>]: number }>;
};

function Table<T extends BaseRow>(props: Props<T>) {
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

type Row = {
  icon: string;
  status: "NEW" | "OUTDATED" | "MERGED" | "SYNCED";
  count: string;
  title: string;
  url: string;
};

type BaseRow = Record<string, string | number>;

type Column<T extends BaseRow> = keyof T;

type ColumnComponent<T extends BaseRow> = (
  props: ColumnProps<T>
) => React.ReactNode;

type ColumnComponentMap<T extends BaseRow> = Record<
  Column<T>,
  ColumnComponent<T>
>;

type ColumnProps<T extends BaseRow> = {
  row: T;
  column: keyof T;
};

function IconColumn(props: ColumnProps<Row>) {
  const value = props.row[props.column];

  return (
    <Ink.Text
      color={get_status_color(props.row)}
      bold={get_status_bold(props.row)}
    >
      {value}
    </Ink.Text>
  );
}

function StatusColumn(props: ColumnProps<Row>) {
  const value = props.row[props.column];

  return (
    <Ink.Text
      color={get_status_color(props.row)}
      bold={get_status_bold(props.row)}
    >
      {value}
    </Ink.Text>
  );
}

function CountColumn(props: ColumnProps<Row>) {
  const value = props.row[props.column];

  return <Ink.Text dimColor>{value}</Ink.Text>;
}

function TitleColumn(props: ColumnProps<Row>) {
  const value = props.row[props.column];

  return <Ink.Text wrap="truncate-end">{value}</Ink.Text>;
}

function UrlColumn(props: ColumnProps<Row>) {
  const value = props.row[props.column];

  return <Url dimColor>{value}</Url>;
}

function get_status_color(row: Row) {
  switch (row.status) {
    case "NEW":
      return "yellow";
    case "OUTDATED":
      return "red";
    case "MERGED":
      return "purple";
    case "SYNCED":
      return "green";
    default:
      assertNever(row.status);
      return "gray";
  }
}

function get_status_bold(row: Row) {
  switch (row.status) {
    case "NEW":
    case "OUTDATED":
      return true;
    default:
      return false;
  }
}
