'use client'

import { useState, useRef } from 'react'
import Modal from './Modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, Upload, X } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface ProspectImportModalProps {
    isOpen: boolean
    onClose: () => void
    onImport: (file: File) => Promise<void>
}

export function ProspectImportModal({ isOpen, onClose, onImport }: ProspectImportModalProps) {
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
            setSuccess('Prospectos importados exitosamente')
            setSelectedFile(null)
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        } catch (error) {
            console.error('Error importing prospects:', error)
            setError(error instanceof Error ? error.message : 'Error al importar prospectos')
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

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Importar Prospectos desde Excel">
            <div className="space-y-6">
                {/* Instrucciones */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-medium text-blue-900 mb-2">Instrucciones de Importación</h3>
                    <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Use la plantilla descargada desde el menú "Importar Excel"</li>
                        <li>• Complete los datos en las columnas correspondientes</li>
                        <li>• Los campos marcados con * son obligatorios</li>
                        <li>• Estado: A Contactar, Contactado - Esperando, Cotizando, Negociando, Ganado, Perdido, Sin Interés</li>
                        <li>• Intereses: Separe múltiples valores con comas (ej: "Proyecto A, Proyecto B")</li>
                        <li>• País por defecto: Argentina (puede cambiarse)</li>
                    </ul>
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
                        {isUploading ? 'Importando...' : 'Importar Prospectos'}
                    </Button>
                </div>
            </div>
        </Modal>
    )
}