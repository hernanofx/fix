import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Mail, Send, Users, Eye, CheckCircle, XCircle } from 'lucide-react';

interface MarketingEmailTemplate {
    id: string;
    name: string;
    type: string;
    subject: string;
    htmlContent: string;
    textContent: string;
    variables: string[];
    category: string;
    isActive: boolean;
}

interface Prospect {
    id: string;
    name: string;
    email: string;
    situacion?: string;
    city?: string;
    contactName?: string;
}

interface MarketingEmailModalProps {
    prospects: Prospect[];
    selectedProspects: string[];
    onClose: () => void;
}

function MarketingEmailModal({ prospects, selectedProspects, onClose }: MarketingEmailModalProps) {
    const [templates, setTemplates] = useState<MarketingEmailTemplate[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<string>('');
    const [customSubject, setCustomSubject] = useState('');
    const [customVariables, setCustomVariables] = useState<Record<string, string>>({});
    const [isSending, setIsSending] = useState(false);
    const [sendResult, setSendResult] = useState<any>(null);
    const [previewMode, setPreviewMode] = useState(false);

    useEffect(() => {
        // Cargar plantillas disponibles desde la API
        const loadTemplates = async () => {
            try {
                const response = await fetch('/api/clients/prospects/marketing/templates');
                if (response.status === 403) {
                    console.error('Acceso denegado a plantillas de marketing');
                    return;
                }
                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        setTemplates(data.templates);
                    }
                }
            } catch (error) {
                console.error('Error loading templates:', error);
            }
        };

        loadTemplates();
    }, []);

    const handleTemplateChange = (templateId: string) => {
        setSelectedTemplate(templateId);
        setCustomSubject('');
        setCustomVariables({});

        const template = templates.find(t => t.id === templateId);
        if (template) {
            // Establecer valores por defecto para variables comunes
            const defaultVars: Record<string, string> = {};
            template.variables.forEach(variable => {
                if (variable === 'prospectName') defaultVars[variable] = '[Nombre del Prospecto]';
                if (variable === 'companyName') defaultVars[variable] = '[Nombre de la Empresa]';
                if (variable === 'contactName') defaultVars[variable] = '[Nombre del Contacto]';
                if (variable === 'discountPercentage') defaultVars[variable] = '15';
                if (variable === 'validUntil') defaultVars[variable] = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString();
                if (variable === 'daysSinceContact') defaultVars[variable] = '7';
                if (variable === 'projectName') defaultVars[variable] = '[Nombre del Proyecto]';
                if (variable === 'projectValue') defaultVars[variable] = '500.000.000';
                if (variable === 'completionTime') defaultVars[variable] = '8 meses';
            });
            setCustomVariables(defaultVars);
        }
    };

    const handleSendEmails = async () => {
        if (!selectedTemplate || selectedProspects.length === 0) return;

        setIsSending(true);
        setSendResult(null);

        try {
            const response = await fetch('/api/clients/prospects/marketing/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    templateId: selectedTemplate,
                    prospectIds: selectedProspects,
                    customSubject: customSubject || undefined,
                    customVariables
                })
            });

            const result = await response.json();

            if (response.status === 403) {
                setSendResult({
                    success: false,
                    sentCount: 0,
                    failedCount: selectedProspects.length,
                    errors: [result.error || 'Acceso denegado']
                });
            } else if (response.ok) {
                setSendResult(result);
            } else {
                setSendResult({
                    success: false,
                    sentCount: 0,
                    failedCount: selectedProspects.length,
                    errors: [result.error || 'Error en el envío']
                });
            }
        } catch (error) {
            setSendResult({
                success: false,
                sentCount: 0,
                failedCount: selectedProspects.length,
                errors: [error instanceof Error ? error.message : 'Error desconocido']
            });
        } finally {
            setIsSending(false);
        }
    };

    const getPreviewContent = () => {
        const template = templates.find(t => t.id === selectedTemplate);
        if (!template) return '';

        let content = template.htmlContent;
        Object.entries(customVariables).forEach(([key, value]) => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            content = content.replace(regex, value || `[${key}]`);
        });

        return content;
    };

    const selectedProspectsData = prospects.filter(p => selectedProspects.includes(p.id));

    return (
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white border-2 border-blue-200">
            <DialogHeader className="border-b pb-4 bg-blue-50 rounded-t-lg">
                <DialogTitle className="flex items-center gap-2 text-xl font-semibold text-blue-800">
                    <Mail className="h-6 w-6 text-blue-600" />
                    Enviar Emails de Marketing
                </DialogTitle>
            </DialogHeader>

            <div className="space-y-6 py-4">
                {/* Resumen de prospectos seleccionados */}
                <Card className="border-blue-200 shadow-sm">
                    <CardHeader className="bg-blue-50 border-b border-blue-200">
                        <CardTitle className="text-lg flex items-center gap-2 text-blue-800">
                            <Users className="h-5 w-5" />
                            Prospectos Seleccionados ({selectedProspects.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="bg-white">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                            {selectedProspectsData.map(prospect => (
                                <div key={prospect.id} className="flex items-center gap-2 p-2 bg-blue-50 rounded border border-blue-200">
                                    <CheckCircle className="h-4 w-4 text-blue-600" />
                                    <div className="text-sm">
                                        <div className="font-medium text-blue-900">{prospect.name}</div>
                                        <div className="text-blue-700">{prospect.email}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Selección de plantilla */}
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle>Seleccionar Plantilla</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label htmlFor="template" className="text-sm font-medium">Plantilla de Email</Label>
                            <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
                                <SelectTrigger className="border-gray-300 focus:border-blue-500">
                                    <SelectValue placeholder="Selecciona una plantilla..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {templates.map(template => (
                                        <SelectItem key={template.id} value={template.id}>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="border-blue-300 text-blue-700">{template.category}</Badge>
                                                {template.name}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {selectedTemplate && (
                            <div>
                                <Label htmlFor="subject" className="text-sm font-medium">Asunto del Email</Label>
                                <Input
                                    id="subject"
                                    value={customSubject}
                                    onChange={(e) => setCustomSubject(e.target.value)}
                                    placeholder="Asunto personalizado (opcional)"
                                    className="border-gray-300 focus:border-blue-500"
                                />
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Variables personalizables */}
                {selectedTemplate && (
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle>Personalizar Variables</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {Object.entries(customVariables).map(([key, value]) => (
                                    <div key={key}>
                                        <Label htmlFor={key} className="text-sm font-medium">
                                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                        </Label>
                                        <Input
                                            id={key}
                                            value={value}
                                            onChange={(e) => setCustomVariables(prev => ({ ...prev, [key]: e.target.value }))}
                                            className="border-gray-300 focus:border-blue-500"
                                        />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Vista previa */}
                {selectedTemplate && (
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                Vista Previa
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPreviewMode(!previewMode)}
                                    className="border-blue-300 text-blue-700 hover:bg-blue-50"
                                >
                                    <Eye className="h-4 w-4 mr-2" />
                                    {previewMode ? 'Ocultar' : 'Mostrar'} Vista Previa
                                </Button>
                            </CardTitle>
                        </CardHeader>
                        {previewMode && (
                            <CardContent>
                                <div className="border rounded-lg p-4 max-h-96 overflow-y-auto bg-gray-50 border-gray-300">
                                    <div dangerouslySetInnerHTML={{ __html: getPreviewContent() }} />
                                </div>
                            </CardContent>
                        )}
                    </Card>
                )}

                {/* Resultado del envío */}
                {sendResult && (
                    <Alert className={`${sendResult.success ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'} shadow-sm`}>
                        <div className="flex items-center gap-2">
                            {sendResult.success ? (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                                <XCircle className="h-5 w-5 text-red-500" />
                            )}
                            <AlertDescription>
                                <div className="font-medium">
                                    {sendResult.success ? 'Emails enviados exitosamente' : 'Error al enviar emails'}
                                </div>
                                <div className="text-sm mt-1">
                                    Enviados: {sendResult.sentCount} | Fallidos: {sendResult.failedCount}
                                </div>
                                {sendResult.errors.length > 0 && (
                                    <div className="text-sm mt-2 text-red-600">
                                        <strong>Errores:</strong>
                                        <ul className="list-disc list-inside mt-1">
                                            {sendResult.errors.map((error: string, index: number) => (
                                                <li key={index}>{error}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </AlertDescription>
                        </div>
                    </Alert>
                )}

                {/* Botones de acción */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSendEmails}
                        disabled={!selectedTemplate || selectedProspects.length === 0 || isSending}
                        className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                    >
                        {isSending ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Enviando...
                            </>
                        ) : (
                            <>
                                <Send className="h-4 w-4 mr-2" />
                                Enviar Emails ({selectedProspects.length})
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </DialogContent>
    );
}

interface MarketingEmailSectionProps {
    prospects: Prospect[];
}

export function MarketingEmailSection({ prospects: initialProspects }: MarketingEmailSectionProps) {
    const [selectedProspects, setSelectedProspects] = useState<string[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [filterSituacion, setFilterSituacion] = useState<string>('all');
    const [prospects, setProspects] = useState<Prospect[]>(initialProspects);
    const [loading, setLoading] = useState(false);
    const [accessError, setAccessError] = useState<string | null>(null);

    // Cargar prospectos desde la API cuando cambian los filtros
    useEffect(() => {
        const loadProspects = async () => {
            setLoading(true);
            setAccessError(null);
            try {
                const params = new URLSearchParams();
                if (filterSituacion !== 'all') {
                    params.append('situacion', filterSituacion);
                }

                const response = await fetch(`/api/clients/prospects/marketing?${params}`);
                if (response.status === 403) {
                    const errorData = await response.json();
                    setAccessError(errorData.error);
                    return;
                }
                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        setProspects(data.prospects);
                    }
                }
            } catch (error) {
                console.error('Error loading prospects:', error);
            } finally {
                setLoading(false);
            }
        };

        loadProspects();
    }, [filterSituacion]);

    // Filtrar prospectos por situación (ya filtrados desde la API, pero mantener compatibilidad)
    const filteredProspects = prospects;

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedProspects(filteredProspects.map(p => p.id));
        } else {
            setSelectedProspects([]);
        }
    };

    const handleSelectProspect = (prospectId: string, checked: boolean) => {
        if (checked) {
            setSelectedProspects(prev => [...prev, prospectId]);
        } else {
            setSelectedProspects(prev => prev.filter(id => id !== prospectId));
        }
    };

    const getSituacionBadgeColor = (situacion?: string) => {
        switch (situacion) {
            case 'A_CONTACTAR': return 'bg-gray-100 text-gray-800 border-gray-300';
            case 'CONTACTADO_ESPERANDO': return 'bg-blue-100 text-blue-800 border-blue-300';
            case 'COTIZANDO': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
            case 'NEGOCIANDO': return 'bg-orange-100 text-orange-800 border-orange-300';
            case 'GANADO': return 'bg-green-100 text-green-800 border-green-300';
            case 'PERDIDO': return 'bg-red-100 text-red-800 border-red-300';
            case 'SIN_INTERES': return 'bg-purple-100 text-purple-800 border-purple-300';
            default: return 'bg-gray-100 text-gray-800 border-gray-300';
        }
    };

    return (
        <div className="space-y-6">
            {/* Mostrar error de acceso si existe */}
            {accessError && (
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="text-red-500">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-red-800">Acceso Restringido</h3>
                                <p className="text-red-700">{accessError}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Header con filtros y acciones */}
            <Card className="shadow-sm border-gray-200">
                <CardHeader className="bg-gray-50 border-b border-gray-200">
                    <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Mail className="h-5 w-5 text-blue-600" />
                            Marketing por Email
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                                <Label htmlFor="situacion-filter" className="text-sm font-medium">Filtrar por situación:</Label>
                                <Select value={filterSituacion} onValueChange={setFilterSituacion}>
                                    <SelectTrigger className="w-40 border-gray-300 focus:border-blue-500">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos</SelectItem>
                                        <SelectItem value="A_CONTACTAR">A Contactar</SelectItem>
                                        <SelectItem value="CONTACTADO_ESPERANDO">Contactado - Esperando</SelectItem>
                                        <SelectItem value="COTIZANDO">Cotizando</SelectItem>
                                        <SelectItem value="NEGOCIANDO">Negociando</SelectItem>
                                        <SelectItem value="GANADO">Ganado</SelectItem>
                                        <SelectItem value="PERDIDO">Perdido</SelectItem>
                                        <SelectItem value="SIN_INTERES">Sin Interés</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button
                                onClick={() => setShowModal(true)}
                                disabled={selectedProspects.length === 0 || !!accessError}
                                className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                            >
                                <Send className="h-4 w-4 mr-2" />
                                Enviar Email ({selectedProspects.length})
                            </Button>
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardContent className="bg-white">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="select-all"
                                checked={selectedProspects.length === filteredProspects.length && filteredProspects.length > 0}
                                onCheckedChange={handleSelectAll}
                                className="border-gray-300"
                            />
                            <Label htmlFor="select-all" className="text-sm font-medium">
                                Seleccionar todos ({loading ? '...' : filteredProspects.length})
                            </Label>
                        </div>
                        {selectedProspects.length > 0 && (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800 border border-blue-300">
                                {selectedProspects.length} seleccionados
                            </Badge>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Lista de prospectos */}
            <Card className="shadow-sm border-gray-200">
                <CardHeader className="bg-gray-50 border-b border-gray-200">
                    <CardTitle>Prospectos Disponibles</CardTitle>
                </CardHeader>
                <CardContent className="bg-white">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin mr-2 text-blue-600" />
                            <span className="text-gray-600">Cargando prospectos...</span>
                        </div>
                    ) : (
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {filteredProspects.map(prospect => (
                                <div key={prospect.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <Checkbox
                                            id={`prospect-${prospect.id}`}
                                            checked={selectedProspects.includes(prospect.id)}
                                            onCheckedChange={(checked) => handleSelectProspect(prospect.id, checked as boolean)}
                                            className="border-gray-300"
                                        />
                                        <div>
                                            <div className="font-medium text-gray-900">{prospect.name}</div>
                                            <div className="text-sm text-gray-500">{prospect.email}</div>
                                            {prospect.city && (
                                                <div className="text-sm text-gray-500">{prospect.city}</div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {prospect.situacion && (
                                            <Badge className={`${getSituacionBadgeColor(prospect.situacion)} border`}>
                                                {prospect.situacion}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {filteredProspects.length === 0 && (
                                <div className="text-center py-8 text-gray-500">
                                    No hay prospectos disponibles con el filtro seleccionado.
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Modal de envío */}
            {showModal && !accessError && (
                <Dialog open={showModal} onOpenChange={setShowModal}>
                    <MarketingEmailModal
                        prospects={prospects}
                        selectedProspects={selectedProspects}
                        onClose={() => setShowModal(false)}
                    />
                </Dialog>
            )}
        </div>
    );
}