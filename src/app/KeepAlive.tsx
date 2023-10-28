import React from "react";

export function KeepAlive() {
  // Exit the app after 5 seconds
  React.useEffect(() => {
    const timer = setInterval(() => {}, 5 * 1000);

    return function cleanup() {
      clearInterval(timer);
    };
  }, []);

  return null;
}
