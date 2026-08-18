import { useState } from "react";

type BrandMarkProps = {
  className?: string;
};

export function BrandMark({ className }: BrandMarkProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <span className="logo__mark">LK</span>;
  }

  return (
    <img
      className={className ? `logo__image ${className}` : "logo__image"}
      src="/image/logo.png"
      alt="Логотип"
      onError={() => setFailed(true)}
    />
  );
}
