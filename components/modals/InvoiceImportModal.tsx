'use client'

import { useState, useRef } from 'react'
import Modal from './Modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, Download, Upload, X } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface InvoiceImportModalProps {
    isOpen: boolean
    onClose: () => void
    onImport: (file: File) => Promise<void>
}

export function InvoiceImportModal({ isOpen, onClose, onImport }: InvoiceImportModalProps) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            // Validar tipo de archivo
            if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
                setError('Solo se permiten archivos Excel (.xlsx, .xls)')
                return
            }

            // Validar tamaño (máximo 10MB)
            if (file.size > 10 * 1024 * 1024) {
                setError('El archivo no puede superar los 10MB')
                return
            }

            setSelectedFile(file)
            setError(null)
            setSuccess(null)
        }
    }

    const handleImport = async () => {
        if (!selectedFile) return

        setIsUploading(true)
        setError(null)
        setSuccess(null)

        try {
            await onImport(selectedFile)
            setSuccess('Facturas importadas exitosamente')
            setSelectedFile(null)
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        } catch (error) {
            console.error('Error importing invoices:', error)
            setError(error instanceof Error ? error.message : 'Error al importar facturas')
        } finally {
            setIsUploading(false)
        }
    }

    const handleClose = () => {
        setSelectedFile(null)
        setError(null)
        setSuccess(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
        onClose()
    }

    const downloadTemplate = () => {
        // Crear datos de ejemplo para la plantilla
        const templateData = [
            {
                'Number': 'INV-2024-001',
                'Client Name': 'Empresa XYZ Ltda.',
                'Client Email': 'contacto@empresa.cl',
                'Client Phone': '+56912345678',
                'Client Address': 'Av. Principal 123, Santiago',
                'Description': 'Servicios de consultoría',
                'Amount': 1500000,
                'Tax': 285000,
                'Total': 1785000,
                'Currency': 'PESOS',
                'Status': 'PENDING',
                'Issue Date': '2024-01-15',
                'Due Date': '2024-02-15',
                'Paid Date': '',
                'Notes': 'Factura por servicios profesionales',
                'Client ID': '',
                'Provider ID': '',
                'Project ID': '',
                'Rubro ID': ''
            },
            {
                'Number': 'INV-2024-002',
                'Client Name': 'Constructora ABC S.A.',
                'Client Email': 'admin@constructora.cl',
                'Client Phone': '+56987654321',
                'Client Address': 'Calle Industrial 456, Concepción',
                'Description': 'Materiales de construcción',
                'Amount': 2500000,
                'Tax': 475000,
                'Total': 2975000,
                'Currency': 'PESOS',
                'Status': 'SENT',
                'Issue Date': '2024-01-20',
                'Due Date': '2024-02-20',
                'Paid Date': '',
                'Notes': 'Factura por materiales entregados',
                'Client ID': '',
                'Provider ID': '',
                'Project ID': '',
                'Rubro ID': ''
            }
        ]

        // Crear y descargar archivo Excel
        import('xlsx').then(XLSX => {
            const ws = XLSX.utils.json_to_sheet(templateData)
            const wb = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(wb, ws, 'Plantilla_Facturas')

            // Configurar ancho de columnas
            ws['!cols'] = [
                { wch: 15 }, // Number
                { wch: 20 }, // Client Name
                { wch: 25 }, // Client Email
                { wch: 15 }, // Client Phone
                { wch: 30 }, // Client Address
                { wch: 30 }, // Description
                { wch: 12 }, // Amount
                { wch: 8 },  // Tax
                { wch: 12 }, // Total
                { wch: 10 }, // Currency
                { wch: 12 }, // Status
                { wch: 12 }, // Issue Date
                { wch: 12 }, // Due Date
                { wch: 12 }, // Paid Date
                { wch: 30 }, // Notes
                { wch: 15 }, // Client ID
                { wch: 15 }, // Provider ID
                { wch: 15 }, // Project ID
                { wch: 15 }  // Rubro ID
            ]

            XLSX.writeFile(wb, 'plantilla_facturas.xlsx')
        })
    }

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Importar Facturas desde Excel">
            <div className="space-y-6">
                {/* Instrucciones */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-medium text-blue-900 mb-2">Instrucciones de Importación</h3>
                    <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Descargue la plantilla para ver el formato requerido</li>
                        <li>• Los campos marcados con * son obligatorios: Number, Client Name, Amount</li>
                        <li>• Estados válidos: DRAFT, PENDING, SENT, PARTIAL, PAID, OVERDUE, CANCELLED</li>
                        <li>• Monedas válidas: PESOS, USD, EUR</li>
                        <li>• Fechas en formato YYYY-MM-DD</li>
                        <li>• Si no se especifica Total, se calculará automáticamente (Amount + Tax)</li>
                        <li>• IDs de relaciones son opcionales (se buscarán por nombre si no se especifican)</li>
                    </ul>
                </div>

                {/* Botón de descarga de plantilla */}
                <div className="flex justify-center">
                    <Button
                        onClick={downloadTemplate}
                        variant="outline"
                        className="flex items-center gap-2"
                    >
                        <Download className="w-4 h-4" />
                        Descargar Plantilla Excel
                    </Button>
                </div>

                {/* Selector de archivo */}
                <div className="space-y-2">
                    <Label htmlFor="file-upload">Seleccionar archivo Excel</Label>
                    <div className="flex items-center gap-2">
                        <Input
                            ref={fileInputRef}
                            id="file-upload"
                            type="file"
                            accept=".xlsx,.xls"
                            onChange={handleFileSelect}
                            className="flex-1"
                        />
                        {selectedFile && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setSelectedFile(null)
                                    if (fileInputRef.current) {
                                        fileInputRef.current.value = ''
                                    }
                                }}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                    {selectedFile && (
                        <p className="text-sm text-gray-600">
                            Archivo seleccionado: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                        </p>
                    )}
                </div>

                {/* Mensajes de error y éxito */}
                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {success && (
                    <Alert className="border-green-200 bg-green-50">
                        <AlertCircle className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800">{success}</AlertDescription>
                    </Alert>
                )}

                {/* Botones de acción */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button variant="outline" onClick={handleClose}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleImport}
                        disabled={!selectedFile || isUploading}
                        className="flex items-center gap-2"
                    >
                        <Upload className="w-4 h-4" />
                        {isUploading ? 'Importando...' : 'Importar Facturas'}
                    </Button>
                </div>
            </div>
        </Modal>
    )
}
