import { LOGO_SRC, BRAND_NAME } from "../lib/brand";

type BrandMarkProps = {
  className?: string;
  plate?: boolean;
};

export function BrandMark({ className, plate = false }: BrandMarkProps) {
  const image = (
    <img
      className={className ? `logo__image ${className}` : "logo__image"}
      src={LOGO_SRC}
      alt={BRAND_NAME}
    />
  );

  if (!plate) {
    return image;
  }

  return <span className="logo-plate">{image}</span>;
}
