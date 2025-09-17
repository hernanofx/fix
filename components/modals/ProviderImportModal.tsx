'use client'

import { useState, useRef } from 'react'
import Modal from './Modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, Download, Upload, X } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface ProviderImportModalProps {
    isOpen: boolean
    onClose: () => void
    onImport: (file: File) => Promise<void>
}

export function ProviderImportModal({ isOpen, onClose, onImport }: ProviderImportModalProps) {
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
            setSuccess('Proveedores importados exitosamente')
            setSelectedFile(null)
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        } catch (error) {
            console.error('Error importing providers:', error)
            setError(error instanceof Error ? error.message : 'Error al importar proveedores')
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
                'Name': 'Constructora XYZ Ltda.',
                'Email': 'contacto@constructoraxyz.cl',
                'Phone': '+56912345678',
                'Address': 'Av. Providencia 123, Santiago',
                'City': 'Santiago',
                'Country': 'Argentina',
                'RUT': '12-34567890-1',
                'Contact Name': 'Juan Pérez',
                'Contact Phone': '+56987654321',
                'Website': 'https://constructoraxyz.cl',
                'Category': 'Construcción',
                'Payment Terms': '30 días',
                'Notes': 'Proveedor confiable de materiales de construcción',
                'Status': 'ACTIVE'
            },
            {
                'Name': 'Materiales del Sur S.A.',
                'Email': 'ventas@materiales.cl',
                'Phone': '+56911223344',
                'Address': 'Calle Industrial 456, Concepción',
                'City': 'Concepción',
                'Country': 'Argentina',
                'RUT': '13-98765432-2',
                'Contact Name': 'María González',
                'Contact Phone': '+56944332211',
                'Website': 'https://materiales.cl',
                'Category': 'Materiales',
                'Payment Terms': '15 días',
                'Notes': 'Especialistas en materiales de construcción',
                'Status': 'ACTIVE'
            }
        ]

        // Crear y descargar archivo Excel
        import('xlsx').then(XLSX => {
            const ws = XLSX.utils.json_to_sheet(templateData)
            const wb = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(wb, ws, 'Plantilla_Proveedores')

            // Configurar ancho de columnas
            ws['!cols'] = [
                { wch: 25 }, // Name
                { wch: 30 }, // Email
                { wch: 15 }, // Phone
                { wch: 30 }, // Address
                { wch: 15 }, // City
                { wch: 15 }, // Country
                { wch: 15 }, // CUIT
                { wch: 20 }, // Contact Name
                { wch: 15 }, // Contact Phone
                { wch: 25 }, // Website
                { wch: 15 }, // Category
                { wch: 20 }, // Payment Terms
                { wch: 30 }, // Notes
                { wch: 12 }  // Status
            ]

            XLSX.writeFile(wb, 'plantilla_proveedores.xlsx')
        })
    }

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Importar Proveedores desde Excel">
            <div className="space-y-6">
                {/* Instrucciones */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-medium text-blue-900 mb-2">Instrucciones de Importación</h3>
                    <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Descargue la plantilla para ver el formato requerido</li>
                        <li>• Los campos marcados con * son obligatorios: Name</li>
                        <li>• Estados válidos: ACTIVE, INACTIVE, SUSPENDED, ARCHIVED</li>
                        <li>• País por defecto: Argentina (se puede cambiar)</li>
                        <li>• Los demás campos son opcionales</li>
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
                        {isUploading ? 'Importando...' : 'Importar Proveedores'}
                    </Button>
                </div>
            </div>
        </Modal>
    )
}
