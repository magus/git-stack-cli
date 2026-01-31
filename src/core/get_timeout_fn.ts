export function get_timeout_fn(ms: number, message: string) {
  return async function timeout<T>(promise: Promise<T>) {
    let id: ReturnType<typeof setTimeout>;

    const timeout = new Promise<never>((_resolve, reject) => {
      id = setTimeout(() => reject(new Error(message)), ms);
    });

    return Promise.race([promise, timeout]).finally(() => clearTimeout(id));
  };
}
