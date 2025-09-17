import * as React from "react"
import { cn } from "@/lib/utils"

const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
    ({ className, ...props }, ref) => (
        <div className="relative w-full overflow-auto rounded-lg border border-slate-200/60 bg-white/80 backdrop-blur-sm shadow-lg">
            <table ref={ref} className={cn("w-full caption-bottom text-sm", className)} {...props} />
        </div>
    ),
)
Table.displayName = "Table"

const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
    ({ className, ...props }, ref) => (
        <thead
            ref={ref}
            className={cn(
                "bg-gradient-to-r from-slate-50 to-slate-100/80 [&_tr]:border-b [&_tr]:border-slate-200",
                className,
            )}
            {...props}
        />
    ),
)
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
    ({ className, ...props }, ref) => (
        <tbody
            ref={ref}
            className={cn("[&_tr:last-child]:border-0 [&_tr:nth-child(even)]:bg-slate-50/30", className)}
            {...props}
        />
    ),
)
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
    ({ className, ...props }, ref) => (
        <tfoot
            ref={ref}
            className={cn(
                "border-t border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100/80 font-semibold [&>tr]:last:border-b-0",
                className,
            )}
            {...props}
        />
    ),
)
TableFooter.displayName = "TableFooter"

const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
    ({ className, ...props }, ref) => (
        <tr
            ref={ref}
            className={cn(
                "border-b border-slate-200/60 transition-all duration-150 ease-out hover:bg-slate-100/60 data-[state=selected]:bg-blue-50/80 data-[state=selected]:border-blue-200",
                className,
            )}
            {...props}
        />
    ),
)
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
    ({ className, ...props }, ref) => (
        <th
            ref={ref}
            className={cn(
                "h-14 px-6 text-left align-middle font-semibold text-slate-700 [&:has([role=checkbox])]:pr-0 tracking-tight",
                className,
            )}
            {...props}
        />
    ),
)
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
    ({ className, ...props }, ref) => (
        <td
            ref={ref}
            className={cn("px-6 py-4 align-middle text-slate-900 [&:has([role=checkbox])]:pr-0", className)}
            {...props}
        />
    ),
)
TableCell.displayName = "TableCell"

const TableCaption = React.forwardRef<HTMLTableCaptionElement, React.HTMLAttributes<HTMLTableCaptionElement>>(
    ({ className, ...props }, ref) => (
        <caption ref={ref} className={cn("mt-6 text-sm text-slate-600 font-medium", className)} {...props} />
    ),
)
TableCaption.displayName = "TableCaption"

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption }
