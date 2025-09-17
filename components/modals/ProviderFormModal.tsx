'use client'

import { useState, useEffect } from 'react'

interface ProviderFormModalProps {
    isOpen: boolean
    onClose: () => void
    onSave: (providerData: any) => void
    provider: any
    readOnly?: boolean
}

export default function ProviderFormModal({ isOpen, onClose, onSave, provider, readOnly = false }: ProviderFormModalProps) {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        country: 'Argentina',
        rut: '',
        contactName: '',
        contactPhone: '',
        website: '',
        category: '',
        paymentTerms: '',
        notes: '',
        status: 'ACTIVE'
    })

    useEffect(() => {
        if (provider) {
            setFormData({
                name: provider.name || '',
                email: provider.email || '',
                phone: provider.phone || '',
                address: provider.address || '',
                city: provider.city || '',
                country: provider.country || 'Argentina',
                rut: provider.rut || '',
                contactName: provider.contactName || '',
                contactPhone: provider.contactPhone || '',
                website: provider.website || '',
                category: provider.category || '',
                paymentTerms: provider.paymentTerms || '',
                notes: provider.notes || '',
                status: provider.status || 'ACTIVE'
            })
        } else {
            setFormData({
                name: '',
                email: '',
                phone: '',
                address: '',
                city: '',
                country: 'Argentina',
                rut: '',
                contactName: '',
                contactPhone: '',
                website: '',
                category: '',
                paymentTerms: '',
                notes: '',
                status: 'ACTIVE'
            })
        }
    }, [provider, isOpen])

    if (!isOpen) return null

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (readOnly) return

        const providerData = {
            ...formData
        }
        onSave(providerData)
        onClose()
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-medium text-gray-900">
                        {readOnly ? 'Detalles del Proveedor' : (provider ? 'Editar Proveedor' : 'Crear Proveedor')}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <span className="sr-only">Cerrar</span>
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Nombre de la Empresa */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Nombre de la Empresa *
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className={`w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${readOnly ? 'bg-gray-100' : ''}`}
                                readOnly={readOnly}
                                required
                            />
                        </div>

                        {/* CUIT */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                CUIT
                            </label>
                            <input
                                type="text"
                                name="rut"
                                value={formData.rut}
                                onChange={handleChange}
                                className={`w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${readOnly ? 'bg-gray-100' : ''}`}
                                readOnly={readOnly}
                                placeholder="12-34567890-1"
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className={`w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${readOnly ? 'bg-gray-100' : ''}`}
                                readOnly={readOnly}
                            />
                        </div>

                        {/* Teléfono */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Teléfono
                            </label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                className={`w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${readOnly ? 'bg-gray-100' : ''}`}
                                readOnly={readOnly}
                            />
                        </div>

                        {/* Sitio Web */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Sitio Web
                            </label>
                            <input
                                type="url"
                                name="website"
                                value={formData.website}
                                onChange={handleChange}
                                className={`w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${readOnly ? 'bg-gray-100' : ''}`}
                                readOnly={readOnly}
                                placeholder="https://www.ejemplo.com"
                            />
                        </div>

                        {/* Categoría */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Categoría
                            </label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className={`w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${readOnly ? 'bg-gray-100' : ''}`}
                                disabled={readOnly}
                            >
                                <option value="">Seleccionar categoría</option>
                                <option value="Materiales">Materiales</option>
                                <option value="Servicios">Servicios</option>
                                <option value="Equipos">Equipos</option>
                                <option value="Herramientas">Herramientas</option>
                                <option value="Transporte">Transporte</option>
                                <option value="Consultoría">Consultoría</option>
                                <option value="Otro">Otro</option>
                            </select>
                        </div>

                        {/* Persona de Contacto */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Persona de Contacto
                            </label>
                            <input
                                type="text"
                                name="contactName"
                                value={formData.contactName}
                                onChange={handleChange}
                                className={`w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${readOnly ? 'bg-gray-100' : ''}`}
                                readOnly={readOnly}
                            />
                        </div>

                        {/* Teléfono de Contacto */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Teléfono de Contacto
                            </label>
                            <input
                                type="tel"
                                name="contactPhone"
                                value={formData.contactPhone}
                                onChange={handleChange}
                                className={`w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${readOnly ? 'bg-gray-100' : ''}`}
                                readOnly={readOnly}
                            />
                        </div>

                        {/* Dirección */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Dirección
                            </label>
                            <input
                                type="text"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                className={`w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${readOnly ? 'bg-gray-100' : ''}`}
                                readOnly={readOnly}
                            />
                        </div>

                        {/* Ciudad */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Ciudad
                            </label>
                            <input
                                type="text"
                                name="city"
                                value={formData.city}
                                onChange={handleChange}
                                className={`w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${readOnly ? 'bg-gray-100' : ''}`}
                                readOnly={readOnly}
                            />
                        </div>

                        {/* País */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                País
                            </label>
                            <select
                                name="country"
                                value={formData.country}
                                onChange={handleChange}
                                className={`w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${readOnly ? 'bg-gray-100' : ''}`}
                                disabled={readOnly}
                            >
                                <option value="Argentina">Argentina</option>
                                <option value="Chile">Chile</option>
                                <option value="Perú">Perú</option>
                                <option value="Colombia">Colombia</option>
                                <option value="México">México</option>
                                <option value="Otro">Otro</option>
                            </select>
                        </div>

                        {/* Estado */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Estado
                            </label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className={`w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${readOnly ? 'bg-gray-100' : ''}`}
                                disabled={readOnly}
                            >
                                <option value="ACTIVE">Activo</option>
                                <option value="INACTIVE">Inactivo</option>
                                <option value="SUSPENDED">Suspendido</option>
                                <option value="ARCHIVED">Archivado</option>
                            </select>
                        </div>
                    </div>

                    {/* Términos de Pago */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Términos de Pago
                        </label>
                        <select
                            name="paymentTerms"
                            value={formData.paymentTerms}
                            onChange={handleChange}
                            className={`w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${readOnly ? 'bg-gray-100' : ''}`}
                            disabled={readOnly}
                        >
                            <option value="">Seleccionar términos</option>
                            <option value="Contado">Contado</option>
                            <option value="7 días">7 días</option>
                            <option value="15 días">15 días</option>
                            <option value="30 días">30 días</option>
                            <option value="45 días">45 días</option>
                            <option value="60 días">60 días</option>
                            <option value="90 días">90 días</option>
                            <option value="Otro">Otro</option>
                        </select>
                    </div>

                    {/* Notas */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Notas
                        </label>
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            rows={4}
                            className={`w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${readOnly ? 'bg-gray-100' : ''}`}
                            readOnly={readOnly}
                            placeholder="Notas adicionales sobre el proveedor..."
                        />
                    </div>

                    <div className="flex justify-end space-x-3 pt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            {readOnly ? 'Cerrar' : 'Cancelar'}
                        </button>
                        {!readOnly && (
                            <button
                                type="submit"
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                {provider ? 'Actualizar' : 'Crear'}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    )
}
