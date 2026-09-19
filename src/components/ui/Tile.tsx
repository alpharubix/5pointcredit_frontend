interface TileProps {
  title: string;
  value: string | number;
  className?: string;
}

export function Tile({ title, value, className = '' }: TileProps) {
  return (
    <div
      className={`border border-gray-200/90 rounded-lg px-3.5 py-2.5 bg-white flex flex-col justify-center min-h-[56px] transition-all shadow-sm ${className}`}
    >
      <span className="text-[10px] font-semibold text-gray-400 tracking-wider uppercase mb-0.5 leading-tight truncate">
        {title}
      </span>
      <span className="text-xs md:text-[13px] font-bold text-[#000080] truncate leading-tight">
        {value !== undefined && value !== null && value !== '' ? String(value) : '-'}
      </span>
    </div>
  );
}

export default Tile;
