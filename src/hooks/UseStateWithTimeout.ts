import { useState, useEffect } from "react";

const useStateWithTimeout = <T>(
  defaultValue: T,
  delay: number
): [T | null, React.Dispatch<React.SetStateAction<T | null>>] => {
  const [value, setValue] = useState<T | null>(defaultValue);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (value !== null) {
      timer = setTimeout(() => setValue(null), delay);
    }

    return () => clearTimeout(timer); // Cleanup timeout on component unmount or when value changes
  }, [value, delay]);

  return [value, setValue];
};

export default useStateWithTimeout;
