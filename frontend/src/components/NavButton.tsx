import { NavLink, useNavigate } from "react-router-dom";

type BtnProps = {
  to: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "muted";
  size?: "sm" | "md";
  className?: string;
};

export function NavButton({ to, children, variant = "secondary", size = "md", className = "" }: BtnProps) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      className={`ui-btn ui-btn--${variant} ui-btn--${size} ${className}`.trim()}
      onClick={() => navigate(to)}
    >
      {children}
    </button>
  );
}

type TabProps = { to: string; children: React.ReactNode; end?: boolean };

export function NavTab({ to, children, end }: TabProps) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) => `nav-tab${isActive ? " nav-tab--active" : ""}`}
    >
      {children}
    </NavLink>
  );
}
