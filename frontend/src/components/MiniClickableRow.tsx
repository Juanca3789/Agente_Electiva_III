import { KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";

type Props = {
  to: string;
  label: string;
};

export default function MiniClickableRow({ to, label }: Props) {
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
    <li className="mini-list-row mini-list-row--clickable" role="button" tabIndex={0} onClick={go} onKeyDown={onKeyDown}>
      <span className="mini-list-label">{label}</span>
    </li>
  );
}
