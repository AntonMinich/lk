import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";

type UserMenuItem = {
  label: string;
  to?: string;
  onClick?: () => void;
  danger?: boolean;
};

type UserMenuProps = {
  name: string;
  role?: string;
  items: UserMenuItem[];
};

export function UserMenu({ name, role = "Сотрудник", items }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const initial = (name.trim().charAt(0) || "A").toUpperCase();

  useEffect(() => {
    function handlePointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  function itemClass(item: UserMenuItem) {
    return item.danger ? "user-menu__item user-menu__item--danger" : "user-menu__item";
  }

  function renderItem(item: UserMenuItem): ReactNode {
    if (item.to) {
      return (
        <Link key={item.label} to={item.to} className={itemClass(item)} onClick={() => setOpen(false)}>
          {item.label}
        </Link>
      );
    }
    return (
      <button
        key={item.label}
        type="button"
        className={itemClass(item)}
        onClick={() => {
          setOpen(false);
          item.onClick?.();
        }}
      >
        {item.label}
      </button>
    );
  }

  return (
    <div className="user-menu" ref={rootRef}>
      <div className="user-menu__who">
        <span className="user-menu__name">{name}</span>
        <span className="user-menu__role">{role}</span>
      </div>
      <button
        type="button"
        className="user-menu__avatar"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Меню пользователя"
        onClick={() => setOpen((value) => !value)}
      >
        {initial}
      </button>
      {open ? (
        <div className="user-menu__dropdown" role="menu">
          {items.map(renderItem)}
        </div>
      ) : null}
    </div>
  );
}
