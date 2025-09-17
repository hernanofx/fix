'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

export default function TestForm() {
    const [formData, setFormData] = useState({
        name: '',
        selectValue: '',
        textareaValue: ''
    })

    return (
        <div className="max-w-2xl mx-auto p-8 bg-white">
            <h1 className="text-2xl font-bold mb-8 text-gray-900">Test de Formulario - Fondos Sólidos</h1>

            <div className="space-y-6">
                {/* Input Test */}
                <div className="space-y-2">
                    <Label htmlFor="name">Nombre (Input)</Label>
                    <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Escribe algo aquí..."
                    />
                </div>

                {/* Select Test */}
                <div className="space-y-2">
                    <Label htmlFor="select">Selección (Select)</Label>
                    <Select value={formData.selectValue} onValueChange={(value) => setFormData({ ...formData, selectValue: value })}>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecciona una opción" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="option1">Opción 1</SelectItem>
                            <SelectItem value="option2">Opción 2</SelectItem>
                            <SelectItem value="option3">Opción 3</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Textarea Test */}
                <div className="space-y-2">
                    <Label htmlFor="textarea">Descripción (Textarea)</Label>
                    <Textarea
                        id="textarea"
                        value={formData.textareaValue}
                        onChange={(e) => setFormData({ ...formData, textareaValue: e.target.value })}
                        placeholder="Escribe una descripción..."
                        rows={4}
                    />
                </div>

                {/* Dropdown Test */}
                <div className="space-y-2">
                    <Label>Dropdown Menu Test</Label>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline">Abrir Dropdown</Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem>Opción 1</DropdownMenuItem>
                            <DropdownMenuItem>Opción 2</DropdownMenuItem>
                            <DropdownMenuItem>Opción 3</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Buttons Test */}
                <div className="space-y-2">
                    <Label>Botones Test</Label>
                    <div className="flex gap-4">
                        <Button>Botón Default</Button>
                        <Button variant="outline">Botón Outline</Button>
                        <Button variant="secondary">Botón Secondary</Button>
                        <Button variant="destructive">Botón Destructive</Button>
                    </div>
                </div>
            </div>

            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                <h2 className="text-lg font-semibold mb-2 text-gray-900">Cambios Realizados:</h2>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li>✅ Colores sólidos definidos en tailwind.config.js</li>
                    <li>✅ Select y Dropdown con bg-white y text-gray-900</li>
                    <li>✅ Input y Textarea con fondos sólidos</li>
                    <li>✅ Botones con colores sólidos</li>
                    <li>✅ CSS global con reglas específicas para dropdowns</li>
                    <li>✅ Eliminadas dependencias de colores transparentes</li>
                </ul>
            </div>
        </div>
    )
}
