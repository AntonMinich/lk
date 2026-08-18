type OsMarkProps = {
  subtitle: string;
};

export function OsMark({ subtitle }: OsMarkProps) {
  return (
    <div className="os-mark">
      <span className="os-mark__tile">F</span>
      <span className="os-mark__text">
        <span className="os-mark__title">FINCODE OS</span>
        <span className="os-mark__sub">{subtitle}</span>
      </span>
    </div>
  );
}
