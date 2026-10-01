import { KeyboardEvent, ReactNode } from "react";
import { useNavigate } from "react-router-dom";

type Props = {
  to: string;
  children: ReactNode;
  className?: string;
};

export default function ClickableRow({ to, children, className = "" }: Props) {
  const navigate = useNavigate();

  function go() {
    navigate(to);
  }

  function onKeyDown(event: KeyboardEvent<HTMLLIElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      go();
    }
  }

  return (
    <li
      className={`entity-row entity-row--clickable ${className}`.trim()}
      role="button"
      tabIndex={0}
      onClick={go}
      onKeyDown={onKeyDown}
    >
      {children}
    </li>
  );
}

export function stopRowClick(event: { stopPropagation: () => void }) {
  event.stopPropagation();
}
