import { LOGO_SRC, BRAND_NAME } from "../lib/brand";

type BrandMarkProps = {
  className?: string;
};

export function BrandMark({ className }: BrandMarkProps) {
  return (
    <img
      className={className ? `logo__image ${className}` : "logo__image"}
      src={LOGO_SRC}
      alt={BRAND_NAME}
    />
  );
}
