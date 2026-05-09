import { TableHTMLAttributes } from 'react';

export interface ResponsiveTableProps extends TableHTMLAttributes<HTMLTableElement> {
  wrapperClassName?: string;
}

export function ResponsiveTable({
  children,
  className = '',
  wrapperClassName = '',
  ...tableProps
}: ResponsiveTableProps) {
  return (
    <div className={`overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 ${wrapperClassName}`}>
      <table className={`min-w-full whitespace-nowrap ${className}`} {...tableProps}>
        {children}
      </table>
    </div>
  );
}
