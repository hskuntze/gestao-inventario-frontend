import { useEffect } from "react";

export function useClickOutside(ref: React.RefObject<HTMLElement | null>, onClose: () => void) {
  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, onClose]);
}
