'use client'

import { useState } from 'react'
import Modal from './Modal'

interface TransferModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (transferData: any) => void;
    projects: any[];
}

export default function TransferModal({ isOpen, onClose, onSave, projects }: TransferModalProps) {
    const [formData, setFormData] = useState({
        amount: '',
        description: '',
        currency: 'PESOS',
        fromProject: '',
        toProject: '',
        date: new Date().toISOString().split('T')[0],
        notes: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            ...formData,
            amount: parseFloat(formData.amount),
            type: 'transfer',
            currency: formData.currency
        });
        onClose();
        setFormData({
            amount: '',
            description: '',
            currency: 'PESOS',
            fromProject: '',
            toProject: '',
            date: new Date().toISOString().split('T')[0],
            notes: ''
        });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Nueva Transferencia"
            size="md"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                        Descripción *
                    </label>
                    <input
                        type="text"
                        id="description"
                        name="description"
                        required
                        value={formData.description}
                        onChange={handleChange}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Ej: Transferencia entre proyectos"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                            Monto *
                        </label>
                        <input
                            type="number"
                            id="amount"
                            name="amount"
                            required
                            min="0"
                            step="0.01"
                            value={formData.amount}
                            onChange={handleChange}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="0.00"
                        />
                    </div>

                    <div>
                        <label htmlFor="currency" className="block text-sm font-medium text-gray-700">
                            Moneda *
                        </label>
                        <select
                            id="currency"
                            name="currency"
                            required
                            value={formData.currency}
                            onChange={handleChange}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                            <option value="PESOS">PESOS (ARS)</option>
                            <option value="USD">USD (Dólares)</option>
                            <option value="EUR">EUR (Euros)</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                            Fecha *
                        </label>
                        <input
                            type="date"
                            id="date"
                            name="date"
                            required
                            value={formData.date}
                            onChange={handleChange}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                    </div>

                    <div>
                        <label htmlFor="fromProject" className="block text-sm font-medium text-gray-700">
                            Proyecto Origen *
                        </label>
                        <select
                            id="fromProject"
                            name="fromProject"
                            required
                            value={formData.fromProject}
                            onChange={handleChange}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                            <option value="">Seleccionar proyecto origen</option>
                            {projects.map(project => (
                                <option key={project.id} value={project.id}>{project.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="toProject" className="block text-sm font-medium text-gray-700">
                            Proyecto Destino *
                        </label>
                        <select
                            id="toProject"
                            name="toProject"
                            required
                            value={formData.toProject}
                            onChange={handleChange}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                            <option value="">Seleccionar proyecto destino</option>
                            {projects.map(project => (
                                <option key={project.id} value={project.id}>{project.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                        Notas
                    </label>
                    <textarea
                        id="notes"
                        name="notes"
                        rows={3}
                        value={formData.notes}
                        onChange={handleChange}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Notas adicionales..."
                    />
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Realizar Transferencia
                    </button>
                </div>
            </form>
        </Modal>
    )
}
