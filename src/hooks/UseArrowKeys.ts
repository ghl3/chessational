import { useEffect } from "react";

type ArrowKeysHandler = {
  onLeftArrow: () => void;
  onRightArrow: () => void;
};

const useArrowKeys = ({ onLeftArrow, onRightArrow }: ArrowKeysHandler) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        onLeftArrow();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        onRightArrow();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onLeftArrow, onRightArrow]);
};

export default useArrowKeys;
