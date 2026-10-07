export function TableContainer({ children }: { children: React.ReactNode }) {
  return <div className="scrollbar-thin overflow-x-auto">{children}</div>;
}

export function Table({ children }: { children: React.ReactNode }) {
  return <table className="w-full min-w-160 text-left text-sm">{children}</table>;
}

export function Thead({ children }: { children: React.ReactNode }) {
  return <thead className="border-b border-slate-200/80 bg-slate-50/70 text-xs font-medium text-slate-500">{children}</thead>;
}

export function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`h-10 whitespace-nowrap px-5 font-medium first:pl-5 ${className}`}>{children}</th>;
}

export function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-5 py-3 text-slate-600 ${className}`}>{children}</td>;
}

export function Tr({
  children,
  className = "",
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  /** Rend la ligne cliquable (ex : ouvrir le détail). */
  onClick?: () => void;
}) {
  return (
    <tr
      onClick={onClick}
      className={`border-b border-slate-100 transition-colors duration-100 last:border-0 hover:bg-slate-50/70 ${
        onClick ? "cursor-pointer" : ""
      } ${className}`}
    >
      {children}
    </tr>
  );
}
