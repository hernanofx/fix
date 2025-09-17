'use client'

import { useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import Modal from './Modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Upload, FileText, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

interface PlanningImportModalProps {
    isOpen: boolean
    onClose: () => void
    onImportSuccess: () => void
}

interface ImportResult {
    success: boolean
    message: string
    data?: {
        totalRows: number
        importedRows: number
        errors: string[]
    }
}

export default function PlanningImportModal({
    isOpen,
    onClose,
    onImportSuccess
}: PlanningImportModalProps) {
    const { data: session } = useSession()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [importResult, setImportResult] = useState<ImportResult | null>(null)
    const [dragActive, setDragActive] = useState(false)

    const handleFileSelect = (file: File) => {
        if (file && file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
            setSelectedFile(file)
            setImportResult(null)
        } else {
            alert('Por favor selecciona un archivo Excel válido (.xlsx)')
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            handleFileSelect(file)
        }
    }

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true)
        } else if (e.type === 'dragleave') {
            setDragActive(false)
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)

        const files = e.dataTransfer.files
        if (files && files[0]) {
            handleFileSelect(files[0])
        }
    }

    const handleUpload = async () => {
        if (!selectedFile) return

        setIsUploading(true)
        setImportResult(null)

        try {
            const formData = new FormData()
            formData.append('file', selectedFile)

            const response = await fetch('/api/planning/import/excel', {
                method: 'POST',
                body: formData
            })

            const result = await response.json()

            if (response.ok) {
                setImportResult({
                    success: true,
                    message: 'Importación completada exitosamente',
                    data: result.data
                })
                onImportSuccess()
            } else {
                setImportResult({
                    success: false,
                    message: result.error || 'Error al importar el archivo',
                    data: result.data
                })
            }
        } catch (error) {
            setImportResult({
                success: false,
                message: 'Error de conexión al servidor'
            })
        } finally {
            setIsUploading(false)
        }
    }

    const resetModal = () => {
        setSelectedFile(null)
        setImportResult(null)
        setIsUploading(false)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const handleClose = () => {
        resetModal()
        onClose()
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Importar Tareas de Planning"
            size="lg"
        >
            <div className="space-y-6">
                {/* File Upload Area */}
                <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragActive
                            ? 'border-blue-500 bg-blue-50'
                            : selectedFile
                                ? 'border-green-500 bg-green-50'
                                : 'border-gray-300 hover:border-gray-400'
                        }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    <div className="space-y-4">
                        {selectedFile ? (
                            <div className="flex items-center justify-center space-x-2">
                                <FileText className="h-8 w-8 text-green-500" />
                                <div className="text-left">
                                    <p className="text-sm font-medium text-gray-900">
                                        {selectedFile.name}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                        )}

                        <div>
                            <Label htmlFor="file-upload" className="cursor-pointer">
                                <span className="text-sm font-medium text-blue-600 hover:text-blue-500">
                                    {selectedFile ? 'Cambiar archivo' : 'Seleccionar archivo Excel'}
                                </span>
                                <Input
                                    id="file-upload"
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".xlsx"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                            </Label>
                            <p className="text-xs text-gray-500 mt-1">
                                o arrastra y suelta aquí
                            </p>
                        </div>
                    </div>
                </div>

                {/* Template Download */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                        <FileText className="h-5 w-5 text-blue-500 mt-0.5" />
                        <div>
                            <h4 className="text-sm font-medium text-blue-900">
                                Plantilla de Excel
                            </h4>
                            <p className="text-sm text-blue-700 mt-1">
                                Descarga la plantilla para asegurarte de que el formato sea correcto.
                            </p>
                            <Button
                                variant="outline"
                                size="sm"
                                className="mt-2"
                                onClick={() => window.open('/api/planning/template', '_blank')}
                            >
                                Descargar Plantilla
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Import Result */}
                {importResult && (
                    <Alert className={importResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                        <div className="flex items-start space-x-3">
                            {importResult.success ? (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                                <XCircle className="h-5 w-5 text-red-500" />
                            )}
                            <div className="flex-1">
                                <AlertDescription className={importResult.success ? 'text-green-800' : 'text-red-800'}>
                                    {importResult.message}
                                </AlertDescription>
                                {importResult.data && (
                                    <div className="mt-2 text-sm">
                                        <p>Total de filas: {importResult.data.totalRows}</p>
                                        <p>Filas importadas: {importResult.data.importedRows}</p>
                                        {importResult.data.errors.length > 0 && (
                                            <div className="mt-2">
                                                <p className="font-medium">Errores:</p>
                                                <ul className="list-disc list-inside mt-1 space-y-1">
                                                    {importResult.data.errors.slice(0, 5).map((error, index) => (
                                                        <li key={index} className="text-xs">{error}</li>
                                                    ))}
                                                    {importResult.data.errors.length > 5 && (
                                                        <li className="text-xs">... y {importResult.data.errors.length - 5} más</li>
                                                    )}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </Alert>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4 border-t">
                    <Button
                        variant="outline"
                        onClick={handleClose}
                        disabled={isUploading}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleUpload}
                        disabled={!selectedFile || isUploading}
                    >
                        {isUploading ? 'Importando...' : 'Importar'}
                    </Button>
                </div>
            </div>
        </Modal>
    )
}
