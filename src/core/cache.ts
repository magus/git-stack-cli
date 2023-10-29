type Status = "pending" | "success" | "error";

type Cacheable<T> = () => Promise<T>;

export function cache<T, E>(cacheable: Cacheable<T>) {
  let status: Status = "pending";

  let response: void | T | E;
  let suspender: void | Promise<void>;

  function reset() {
    status = "pending";
    response = undefined;
    suspender = undefined;
  }

  function read() {
    // cacheable is a function to allow deferred reads
    // this will call cacheable to kickoff async promise
    if (!suspender) {
      suspender = cacheable()
        .then((res: T) => {
          status = "success";
          response = res;
        })
        .catch((err: E) => {
          status = "error";
          response = err;
        });
    }

    switch (status) {
      case "pending":
        throw suspender;
      case "error":
        throw response;
      default:
        return response;
    }
  }

  return { reset, read };
}
