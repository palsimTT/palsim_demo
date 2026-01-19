interface DividerProps {
  label?: string;
  className?: string;
}

const Divider = ({ label, className = '' }: DividerProps) => {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <div className="h-px bg-outline-variant" />
      {label && (
        <p className="text-lg text-on-surface-variant">
          {label}
        </p>
      )}
    </div>
  );
};

export default Divider;
