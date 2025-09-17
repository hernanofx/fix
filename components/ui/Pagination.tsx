'use client'

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search, FileSpreadsheet, FileText, Upload, Download, ChevronDown, Table, File } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'

interface PaginationProps {
    currentPage: number
    totalPages: number
    totalItems: number
    itemsPerPage: number
    onPageChange: (page: number) => void
    onItemsPerPageChange: (items: number) => void
    searchTerm?: string
    onSearchChange?: (term: string) => void
    searchPlaceholder?: string
    onImportExcel?: () => void
    onImportPDF?: () => void
    onExportExcel?: () => void
    onExportPDF?: () => void
    onDownloadTemplate?: () => void
}

export default function Pagination({
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    onPageChange,
    onItemsPerPageChange,
    searchTerm = '',
    onSearchChange,
    searchPlaceholder = 'Buscar...',
    onImportExcel,
    onImportPDF,
    onExportExcel,
    onExportPDF,
    onDownloadTemplate
}: PaginationProps) {
    const startItem = (currentPage - 1) * itemsPerPage + 1
    const endItem = Math.min(currentPage * itemsPerPage, totalItems)

    const getVisiblePages = () => {
        const delta = 2
        const range = []
        const rangeWithDots = []

        for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
            range.push(i)
        }

        if (currentPage - delta > 2) {
            rangeWithDots.push(1, '...')
        } else {
            rangeWithDots.push(1)
        }

        rangeWithDots.push(...range)

        if (currentPage + delta < totalPages - 1) {
            rangeWithDots.push('...', totalPages)
        } else if (totalPages > 1) {
            rangeWithDots.push(totalPages)
        }

        return rangeWithDots
    }

    if (totalItems === 0) return null

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-4">
            {/* Información de registros y búsqueda */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {/* Campo de búsqueda */}
                {onSearchChange && (
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            type="text"
                            placeholder={searchPlaceholder}
                            value={searchTerm}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="pl-9 w-64 h-8 text-sm"
                        />
                    </div>
                )}

                {/* Información de registros */}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>Mostrando</span>
                    <Select value={itemsPerPage.toString()} onValueChange={(value) => onItemsPerPageChange(Number(value))}>
                        <SelectTrigger className="w-20 h-8">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="25">25</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                            <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                    </Select>
                    <span>de {totalItems} registros</span>
                    <span className="text-gray-400">
                        ({startItem}-{endItem})
                    </span>
                </div>
            </div>

            {/* Botones de importación y controles de paginación */}
            <div className="flex items-center gap-2">
                {/* Botones de importación y exportación */}
                <div className="flex items-center gap-2">
                    {/* Dropdown de Excel */}
                    {(onImportExcel || onExportExcel) && (
                        <div className="relative group">
                            <Select onValueChange={(value) => {
                                if (value === 'import' && onImportExcel) onImportExcel()
                                if (value === 'export' && onExportExcel) onExportExcel()
                                if (value === 'template' && onDownloadTemplate) onDownloadTemplate()
                            }}>
                                <SelectTrigger className="h-8 w-8 p-0 text-green-700 border-green-300 hover:bg-green-50 hover:border-green-400 bg-green-50/50 relative">
                                    <Table className="h-4 w-4 text-green-600" />
                                    {/* Indicador de dropdown */}
                                    <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-green-600 rounded-full border border-white"></div>
                                </SelectTrigger>
                                <SelectContent>
                                    {onDownloadTemplate && (
                                        <SelectItem value="template" className="cursor-pointer">
                                            <div className="flex items-center gap-2">
                                                <FileText className="h-3 w-3" />
                                                <span>Descargar Plantilla</span>
                                            </div>
                                        </SelectItem>
                                    )}
                                    {onImportExcel && (
                                        <SelectItem value="import" className="cursor-pointer">
                                            <div className="flex items-center gap-2">
                                                <Upload className="h-3 w-3" />
                                                <span>Importar Excel</span>
                                            </div>
                                        </SelectItem>
                                    )}
                                    {onExportExcel && (
                                        <SelectItem value="export" className="cursor-pointer">
                                            <div className="flex items-center gap-2">
                                                <Download className="h-3 w-3" />
                                                <span>Exportar Excel</span>
                                            </div>
                                        </SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                            {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                                Excel
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                            </div>
                        </div>
                    )}

                    {/* Botón de exportar PDF */}
                    {onExportPDF && (
                        <div className="relative group">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onExportPDF}
                                className="h-8 w-8 p-0 text-red-700 border-red-300 hover:bg-red-50 hover:border-red-400 bg-red-50/50"
                            >
                                <File className="h-4 w-4 text-red-600" />
                            </Button>
                            {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                                Exportar PDF
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Controles de paginación */}
                {totalPages > 1 && (
                    <div className="flex items-center gap-1 ml-4">
                        {/* Primera página */}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPageChange(1)}
                            disabled={currentPage === 1}
                            className="h-8 w-8 p-0"
                        >
                            <ChevronsLeft className="h-4 w-4" />
                        </Button>

                        {/* Página anterior */}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="h-8 w-8 p-0"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>

                        {/* Números de página */}
                        <div className="flex items-center gap-1">
                            {getVisiblePages().map((page, index) => (
                                <div key={index}>
                                    {page === '...' ? (
                                        <span className="px-2 py-1 text-sm text-gray-400">...</span>
                                    ) : (
                                        <Button
                                            variant={currentPage === page ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => onPageChange(page as number)}
                                            className={`h-8 min-w-8 px-2 ${currentPage === page
                                                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                                : 'hover:bg-gray-50'
                                                }`}
                                        >
                                            {page}
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Página siguiente */}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="h-8 w-8 p-0"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>

                        {/* Última página */}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPageChange(totalPages)}
                            disabled={currentPage === totalPages}
                            className="h-8 w-8 p-0"
                        >
                            <ChevronsRight className="h-4 w-4" />
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}
