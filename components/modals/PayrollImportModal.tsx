'use client'

import { useState, useRef } from 'react'
import Modal from './Modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, Download, Upload, X } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface PayrollImportModalProps {
    isOpen: boolean
    onClose: () => void
    onImport: (file: File) => Promise<void>
}

export function PayrollImportModal({ isOpen, onClose, onImport }: PayrollImportModalProps) {
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
            setSuccess('Nóminas importadas exitosamente')
            setSelectedFile(null)
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        } catch (error) {
            console.error('Error importing payrolls:', error)
            setError(error instanceof Error ? error.message : 'Error al importar nóminas')
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
                'Employee Name': 'Juan Pérez',
                'Employee Position': 'Ingeniero Civil',
                'Period': '2024-01',
                'Base Salary': 85000,
                'Overtime Hours': 10,
                'Overtime Rate': 1.5,
                'Overtime Pay': 12750,
                'Bonuses': 5000,
                'Deductions': 2000,
                'Deductions Detail': 'Seguro médico',
                'Net Pay': 95000,
                'Currency': 'PESOS',
                'Cash Box': 'Caja Principal',
                'Bank Account': 'Cuenta Nómina'
            },
            {
                'Employee Name': 'Ana García',
                'Employee Position': 'Arquitecta',
                'Period': '2024-01',
                'Base Salary': 92000,
                'Overtime Hours': 5,
                'Overtime Rate': 1.5,
                'Overtime Pay': 6900,
                'Bonuses': 3000,
                'Deductions': 1500,
                'Deductions Detail': 'Impuestos',
                'Net Pay': 98400,
                'Currency': 'PESOS',
                'Cash Box': '',
                'Bank Account': 'Cuenta Corporativa'
            }
        ]

        // Crear y descargar archivo Excel
        import('xlsx').then(XLSX => {
            const ws = XLSX.utils.json_to_sheet(templateData)
            const wb = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(wb, ws, 'Plantilla_Nominas')

            // Configurar ancho de columnas
            ws['!cols'] = [
                { wch: 20 }, // Employee Name
                { wch: 20 }, // Employee Position
                { wch: 15 }, // Period
                { wch: 12 }, // Base Salary
                { wch: 15 }, // Overtime Hours
                { wch: 15 }, // Overtime Rate
                { wch: 12 }, // Overtime Pay
                { wch: 10 }, // Bonuses
                { wch: 12 }, // Deductions
                { wch: 20 }, // Deductions Detail
                { wch: 10 }, // Net Pay
                { wch: 10 }, // Currency
                { wch: 15 }, // Cash Box
                { wch: 15 }  // Bank Account
            ]

            XLSX.writeFile(wb, 'plantilla_nominas.xlsx')
        })
    }

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Importar Nóminas desde Excel">
            <div className="space-y-6">
                {/* Instrucciones */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-medium text-blue-900 mb-2">Instrucciones de Importación</h3>
                    <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Descargue la plantilla para ver el formato requerido</li>
                        <li>• Los campos marcados con * son obligatorios: Employee Name, Period</li>
                        <li>• Monedas válidas: PESOS, USD, EUR</li>
                        <li>• Período en formato YYYY-MM (ej: 2024-01)</li>
                        <li>• Si no se especifica Net Pay, se calculará automáticamente</li>
                        <li>• Cash Box y Bank Account son opcionales (se buscarán por nombre)</li>
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
                        {isUploading ? 'Importando...' : 'Importar Nóminas'}
                    </Button>
                </div>
            </div>
        </Modal>
    )
}
