'use client'

import { useState, useRef } from 'react'
import Modal from './Modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, Download, Upload, X } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface EmployeeImportModalProps {
    isOpen: boolean
    onClose: () => void
    onImport: (file: File) => Promise<void>
}

export function EmployeeImportModal({ isOpen, onClose, onImport }: EmployeeImportModalProps) {
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
            setSuccess('Empleados importados exitosamente')
            setSelectedFile(null)
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        } catch (error) {
            console.error('Error importing employees:', error)
            setError(error instanceof Error ? error.message : 'Error al importar empleados')
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
                nombre: 'Juan',
                apellido: 'Pérez',
                email: 'juan.perez@empresa.com',
                teléfono: '+54911234567',
                puesto: 'Ingeniero Civil',
                departamento: 'Construcción',
                salario: 85000,
                fecha_contratación: '2023-01-15',
                fecha_nacimiento: '1990-05-20',
                dirección: 'Av. Principal 123, Buenos Aires',
                contacto_emergencia: 'María Pérez',
                teléfono_emergencia: '+54911876543',
                estado: 'Activo'
            },
            {
                nombre: 'Ana',
                apellido: 'García',
                email: 'ana.garcia@empresa.com',
                teléfono: '+54911987654',
                puesto: 'Arquitecta',
                departamento: 'Diseño',
                salario: 92000,
                fecha_contratación: '2022-08-01',
                fecha_nacimiento: '1988-12-10',
                dirección: 'Calle Secundaria 456, Córdoba',
                contacto_emergencia: 'Carlos García',
                teléfono_emergencia: '+54911789456',
                estado: 'Activo'
            }
        ]

        // Crear y descargar archivo Excel
        import('xlsx').then(XLSX => {
            const ws = XLSX.utils.json_to_sheet(templateData)
            const wb = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(wb, ws, 'Plantilla_Empleados')

            // Configurar ancho de columnas
            ws['!cols'] = [
                { wch: 15 }, // nombre
                { wch: 15 }, // apellido
                { wch: 30 }, // email
                { wch: 15 }, // teléfono
                { wch: 25 }, // puesto
                { wch: 20 }, // departamento
                { wch: 12 }, // salario
                { wch: 18 }, // fecha_contratación
                { wch: 18 }, // fecha_nacimiento
                { wch: 40 }, // dirección
                { wch: 25 }, // contacto_emergencia
                { wch: 18 }, // teléfono_emergencia
                { wch: 12 }  // estado
            ]

            XLSX.writeFile(wb, 'plantilla_empleados.xlsx')
        })
    }

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Importar Empleados desde Excel">
            <div className="space-y-6">
                {/* Instrucciones */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-medium text-blue-900 mb-2">Instrucciones de Importación</h3>
                    <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Descargue la plantilla para ver el formato requerido</li>
                        <li>• Los campos marcados con * son obligatorios: nombre, apellido</li>
                        <li>• Estados válidos: Activo, Inactivo, Terminado, De Licencia</li>
                        <li>• Fechas en formato YYYY-MM-DD</li>
                        <li>• Salarios sin símbolos de moneda</li>
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
                        {isUploading ? 'Importando...' : 'Importar Empleados'}
                    </Button>
                </div>
            </div>
        </Modal>
    )
}
