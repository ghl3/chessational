// Returns a function that returns true if x < y
export const makeComparator = (
  f: (x: any) => any,
): ((x: any, y: any) => number) => {
  return (x, y) => {
    const x_vals = f(x);
    const y_vals = f(y);

    for (const i in x_vals) {
      const x_val = x_vals[i];
      const y_val = y_vals[i];
      if (x_val < y_val) {
        return -1;
      } else if (y_val < x_val) {
        return 1;
      }
    }
    return 0;
  };
};
