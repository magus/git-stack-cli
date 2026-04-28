type StackGroup = {
  id: string;
  base: null | string;
};

export function base_to_tip<T extends StackGroup>(group_list: Array<T>) {
  const group_by_id = new Map(group_list.map((group) => [group.id, group]));
  const children_by_base = new Map<string, Array<T>>();

  for (const group of group_list) {
    if (!group.base || !group_by_id.has(group.base)) {
      continue;
    }

    const children = children_by_base.get(group.base) || [];
    children.push(group);
    children_by_base.set(group.base, children);
  }

  const result: Array<T> = [];
  const visited = new Set<string>();

  function visit(group: T) {
    if (visited.has(group.id)) {
      return;
    }

    visited.add(group.id);
    result.push(group);

    for (const child of children_by_base.get(group.id) || []) {
      visit(child);
    }
  }

  for (const group of group_list) {
    if (!group.base || !group_by_id.has(group.base)) {
      visit(group);
    }
  }

  for (const group of group_list) {
    visit(group);
  }

  return result;
}
