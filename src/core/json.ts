export function serialize(obj: any): any {
  if (obj instanceof Map) {
    return {
      _type: "Map",
      _value: Array.from(obj.entries()).map(([k, v]) => [k, serialize(v)]),
    };
  } else if (Array.isArray(obj)) {
    return obj.map(serialize);
  } else if (obj !== null && typeof obj === "object") {
    const serializedObj: any = {};
    for (const [key, value] of Object.entries(obj)) {
      serializedObj[key] = serialize(value);
    }
    return serializedObj;
  }
  return obj;
}

export function deserialize(obj: any): any {
  if (obj && obj._type === "Map") {
    return new Map(obj._value.map(([k, v]: [any, any]) => [k, deserialize(v)]));
  } else if (Array.isArray(obj)) {
    return obj.map(deserialize);
  } else if (obj !== null && typeof obj === "object") {
    const deserializedObj: any = {};
    for (const [key, value] of Object.entries(obj)) {
      deserializedObj[key] = deserialize(value);
    }
    return deserializedObj;
  }
  return obj;
}
