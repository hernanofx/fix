import Link from 'next/link'

export default function Privacy() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <Link href="/" className="flex items-center">
                            <h1 className="text-2xl font-bold text-gray-900">Pix</h1>
                            <span className="ml-2 text-sm text-gray-500">Política de Privacidad</span>
                        </Link>
                        <Link
                            href="/register"
                            className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                            ← Volver al registro
                        </Link>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-4">
                            Política de Privacidad
                        </h1>
                        <p className="text-gray-600">
                            Última actualización: {new Date().toLocaleDateString('es-ES', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </p>
                    </div>

                    <div className="prose prose-gray max-w-none">
                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Información que Recopilamos</h2>
                            <p className="text-gray-700 mb-4">
                                En Pix, recopilamos información para proporcionar y mejorar nuestros servicios de gestión de construcción.
                                Recopilamos los siguientes tipos de información:
                            </p>

                            <h3 className="text-xl font-medium text-gray-900 mb-3">Información que usted nos proporciona:</h3>
                            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                                <li>Información de registro (nombre, email, empresa, teléfono)</li>
                                <li>Datos de proyectos, empleados y finanzas que ingresa al sistema</li>
                                <li>Información de contacto para soporte técnico</li>
                                <li>Preferencias de configuración y uso del servicio</li>
                            </ul>

                            <h3 className="text-xl font-medium text-gray-900 mb-3">Información recopilada automáticamente:</h3>
                            <ul className="list-disc list-inside text-gray-700 space-y-2">
                                <li>Dirección IP y ubicación geográfica aproximada</li>
                                <li>Tipo de dispositivo y navegador utilizado</li>
                                <li>Páginas visitadas y tiempo de uso</li>
                                <li>Datos de rendimiento del sistema</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Cómo Utilizamos su Información</h2>
                            <p className="text-gray-700 mb-4">Utilizamos la información recopilada para:</p>
                            <ul className="list-disc list-inside text-gray-700 space-y-2">
                                <li>Proporcionar y mantener el Servicio de gestión de construcción</li>
                                <li>Procesar transacciones y gestionar pagos</li>
                                <li>Enviar notificaciones importantes sobre su cuenta y proyectos</li>
                                <li>Proporcionar soporte técnico y atención al cliente</li>
                                <li>Mejorar y optimizar el rendimiento del Servicio</li>
                                <li>Desarrollar nuevas funcionalidades basadas en patrones de uso</li>
                                <li>Cumplir con obligaciones legales y regulatorias</li>
                                <li>Prevenir fraudes y actividades maliciosas</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Compartir Información</h2>
                            <p className="text-gray-700 mb-4">
                                No vendemos, alquilamos ni compartimos su información personal con terceros, excepto en las siguientes situaciones:
                            </p>
                            <ul className="list-disc list-inside text-gray-700 space-y-2">
                                <li><strong>Proveedores de servicios:</strong> Compartimos información con proveedores que nos ayudan a operar el Servicio (procesadores de pagos, hosting, análisis)</li>
                                <li><strong>Requisitos legales:</strong> Cuando sea requerido por ley, orden judicial o autoridad competente</li>
                                <li><strong>Protección de derechos:</strong> Para proteger nuestros derechos, propiedad o seguridad</li>
                                <li><strong>Transferencias de negocio:</strong> En caso de fusión, adquisición o venta de activos</li>
                                <li><strong>Consentimiento explícito:</strong> Cuando usted nos autorice expresamente a compartir información</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Seguridad de los Datos</h2>
                            <p className="text-gray-700 mb-4">
                                Implementamos medidas de seguridad técnicas, administrativas y físicas para proteger su información:
                            </p>
                            <ul className="list-disc list-inside text-gray-700 space-y-2">
                                <li>Encriptación de datos en tránsito y en reposo</li>
                                <li>Controles de acceso estrictos a la información</li>
                                <li>Monitoreo continuo de sistemas y redes</li>
                                <li>Copias de seguridad regulares y seguras</li>
                                <li>Capacitación del personal en seguridad de datos</li>
                                <li>Auditorías de seguridad periódicas</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Retención de Datos</h2>
                            <p className="text-gray-700 mb-4">
                                Retenemos su información durante el tiempo necesario para proporcionar el Servicio y cumplir con nuestras
                                obligaciones legales:
                            </p>
                            <ul className="list-disc list-inside text-gray-700 space-y-2">
                                <li><strong>Datos de cuenta:</strong> Mientras mantenga una cuenta activa</li>
                                <li><strong>Datos de proyectos:</strong> Según sus necesidades de retención</li>
                                <li><strong>Datos de facturación:</strong> 7 años según requisitos fiscales</li>
                                <li><strong>Datos de soporte:</strong> 3 años después de la resolución del caso</li>
                            </ul>
                            <p className="text-gray-700 mt-4">
                                Puede solicitar la eliminación de su cuenta y datos personales en cualquier momento,
                                sujeto a nuestras obligaciones legales de retención.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Sus Derechos</h2>
                            <p className="text-gray-700 mb-4">
                                Usted tiene los siguientes derechos respecto a sus datos personales:
                            </p>
                            <ul className="list-disc list-inside text-gray-700 space-y-2">
                                <li><strong>Acceso:</strong> Solicitar una copia de los datos personales que tenemos sobre usted</li>
                                <li><strong>Rectificación:</strong> Solicitar la corrección de datos inexactos o incompletos</li>
                                <li><strong>Eliminación:</strong> Solicitar la eliminación de sus datos personales</li>
                                <li><strong>Portabilidad:</strong> Solicitar la transferencia de sus datos a otro proveedor</li>
                                <li><strong>Oposición:</strong> Oponerse al procesamiento de sus datos en ciertas circunstancias</li>
                                <li><strong>Restricción:</strong> Solicitar la limitación del procesamiento de sus datos</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Cookies y Tecnologías Similares</h2>
                            <p className="text-gray-700 mb-4">
                                Utilizamos cookies y tecnologías similares para mejorar su experiencia:
                            </p>
                            <ul className="list-disc list-inside text-gray-700 space-y-2">
                                <li><strong>Cookies esenciales:</strong> Para el funcionamiento básico del Servicio</li>
                                <li><strong>Cookies de rendimiento:</strong> Para analizar el uso y mejorar el rendimiento</li>
                                <li><strong>Cookies de funcionalidad:</strong> Para recordar sus preferencias</li>
                                <li><strong>Cookies de marketing:</strong> Para mostrar contenido relevante (solo con consentimiento)</li>
                            </ul>
                            <p className="text-gray-700 mt-4">
                                Puede gestionar sus preferencias de cookies a través de la configuración de su navegador.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Transferencias Internacionales</h2>
                            <p className="text-gray-700">
                                Sus datos pueden ser transferidos y procesados en países fuera de su país de residencia.
                                Cuando esto ocurra, implementamos medidas apropiadas para proteger sus datos, incluyendo
                                cláusulas contractuales estándar y certificaciones de protección de datos.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Privacidad de Menores</h2>
                            <p className="text-gray-700">
                                El Servicio no está destinado a menores de 18 años. No recopilamos intencionalmente información
                                personal de menores. Si descubrimos que hemos recopilado información de un menor, la eliminaremos
                                inmediatamente.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Cambios a esta Política</h2>
                            <p className="text-gray-700 mb-4">
                                Podemos actualizar esta Política de Privacidad periódicamente. Le notificaremos sobre cambios
                                significativos por email o a través del Servicio con al menos 30 días de anticipación.
                            </p>
                            <p className="text-gray-700">
                                El uso continuado del Servicio después de la fecha efectiva de los cambios constituirá
                                aceptación de la política actualizada.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Contacto</h2>
                            <p className="text-gray-700 mb-4">
                                Si tiene preguntas sobre esta Política de Privacidad o desea ejercer sus derechos,
                                puede contactarnos:
                            </p>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-gray-700"><strong>Responsable de Protección de Datos:</strong> privacy@pix.com</p>
                                <p className="text-gray-700"><strong>Teléfono:</strong> +34 900 123 456</p>
                                <p className="text-gray-700"><strong>Dirección:</strong> Calle Tecnología 123, Madrid, España</p>
                            </div>
                            <p className="text-gray-700 mt-4">
                                Procesaremos su solicitud en un plazo máximo de 30 días y le mantendremos informado
                                sobre el progreso de la misma.
                            </p>
                        </section>
                    </div>

                    {/* Acceptance Section */}
                    <div className="mt-12 p-6 bg-green-50 border border-green-200 rounded-lg">
                        <h3 className="text-lg font-semibold text-green-900 mb-4">Su Privacidad es Nuestra Prioridad</h3>
                        <p className="text-green-800 mb-4">
                            Nos comprometemos a proteger su información y utilizarla únicamente para mejorar su experiencia
                            con Pix. Sus datos están seguros con nosotros.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link
                                href="/register"
                                className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors text-center"
                            >
                                Aceptar y Continuar con el Registro
                            </Link>
                            <Link
                                href="/terms"
                                className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors text-center"
                            >
                                Ver Términos y Condiciones
                            </Link>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-8 mt-12">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <p className="text-gray-400">
                        © 2024 Pix. Todos los derechos reservados.
                    </p>
                </div>
            </footer>
        </div>
    )
}
