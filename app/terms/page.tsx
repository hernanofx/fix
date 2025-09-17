import Link from 'next/link'

export default function Terms() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <Link href="/" className="flex items-center">
                            <h1 className="text-2xl font-bold text-gray-900">Pix</h1>
                            <span className="ml-2 text-sm text-gray-500">Términos y Condiciones</span>
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
                            Términos y Condiciones de Servicio
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
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Aceptación de los Términos</h2>
                            <p className="text-gray-700 mb-4">
                                Al acceder y utilizar Pix ("el Servicio"), usted acepta estar sujeto a estos Términos y Condiciones de Servicio.
                                Si no está de acuerdo con alguna parte de estos términos, no podrá acceder al Servicio.
                            </p>
                            <p className="text-gray-700">
                                Estos términos se aplican a todos los usuarios del Servicio, incluyendo pero no limitado a usuarios individuales,
                                empresas y organizaciones que utilicen Pix para la gestión de proyectos de construcción.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Descripción del Servicio</h2>
                            <p className="text-gray-700 mb-4">
                                Pix es una plataforma de software como servicio (SaaS) diseñada para la gestión integral de proyectos de construcción,
                                que incluye:
                            </p>
                            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                                <li>Gestión de proyectos y cronogramas</li>
                                <li>Control de presupuestos y finanzas</li>
                                <li>Administración de empleados y recursos humanos</li>
                                <li>Sistema de inspecciones y control de calidad</li>
                                <li>Facturación y gestión de cobros</li>
                                <li>Reportes y análisis de datos</li>
                                <li>Control de tiempo y asistencia</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Uso Aceptable</h2>
                            <p className="text-gray-700 mb-4">Usted se compromete a utilizar el Servicio únicamente para fines legales y de acuerdo con estos términos:</p>
                            <ul className="list-disc list-inside text-gray-700 space-y-2">
                                <li>No utilizar el Servicio para actividades ilegales o fraudulentas</li>
                                <li>No compartir credenciales de acceso con terceros no autorizados</li>
                                <li>No intentar acceder a sistemas o datos no autorizados</li>
                                <li>No cargar contenido malicioso o dañino al sistema</li>
                                <li>Respetar los derechos de propiedad intelectual de Pix y terceros</li>
                                <li>No interferir con la operación normal del Servicio</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Cuentas de Usuario</h2>
                            <p className="text-gray-700 mb-4">
                                Para acceder al Servicio, debe crear una cuenta proporcionando información precisa y actualizada.
                                Usted es responsable de:
                            </p>
                            <ul className="list-disc list-inside text-gray-700 space-y-2">
                                <li>Mantener la confidencialidad de sus credenciales</li>
                                <li>Todas las actividades realizadas bajo su cuenta</li>
                                <li>Notificar inmediatamente cualquier uso no autorizado</li>
                                <li>Proporcionar información precisa sobre su organización</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Propiedad Intelectual</h2>
                            <p className="text-gray-700 mb-4">
                                El Servicio y todo su contenido, características y funcionalidad son propiedad de Pix y están protegidos por
                                leyes de derechos de autor, marcas registradas y otras leyes de propiedad intelectual.
                            </p>
                            <p className="text-gray-700">
                                Los datos que usted ingrese al Servicio (proyectos, empleados, finanzas, etc.) siguen siendo de su propiedad,
                                pero nos otorga una licencia limitada para procesar y almacenar esta información según sea necesario para
                                proporcionar el Servicio.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Privacidad y Protección de Datos</h2>
                            <p className="text-gray-700 mb-4">
                                Su privacidad es importante para nosotros. Nuestra{' '}
                                <Link href="/privacy" className="text-blue-600 hover:text-blue-800">
                                    Política de Privacidad
                                </Link>{' '}
                                explica cómo recopilamos, utilizamos y protegemos su información personal y de su organización.
                            </p>
                            <p className="text-gray-700">
                                Al utilizar Pix, usted acepta el procesamiento de datos según lo descrito en nuestra Política de Privacidad,
                                que incluye el cumplimiento con regulaciones de protección de datos aplicables.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Precios y Pagos</h2>
                            <p className="text-gray-700 mb-4">
                                El Servicio se ofrece bajo diferentes planes de suscripción. Los precios actuales y las condiciones de pago
                                se detallan en nuestro sitio web y pueden ser modificados con previo aviso.
                            </p>
                            <ul className="list-disc list-inside text-gray-700 space-y-2">
                                <li>Los pagos se procesan de forma segura a través de proveedores certificados</li>
                                <li>Las facturas se emiten mensualmente por adelantado</li>
                                <li>Los cambios de plan entran en vigor en el siguiente ciclo de facturación</li>
                                <li>Los reembolsos se procesan según nuestra política de cancelación</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Limitación de Responsabilidad</h2>
                            <p className="text-gray-700 mb-4">
                                Pix se proporciona "tal cual" sin garantías de ningún tipo. No garantizamos que el Servicio será ininterrumpido
                                o libre de errores, aunque nos esforzamos por mantener altos estándares de disponibilidad.
                            </p>
                            <p className="text-gray-700">
                                En ningún caso Pix será responsable por daños indirectos, incidentales, especiales o consecuentes,
                                incluyendo pérdida de beneficios, datos o uso del servicio.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Terminación del Servicio</h2>
                            <p className="text-gray-700 mb-4">
                                Cualquiera de las partes puede terminar este acuerdo en cualquier momento. En caso de terminación:
                            </p>
                            <ul className="list-disc list-inside text-gray-700 space-y-2">
                                <li>Usted podrá descargar sus datos durante 30 días después de la terminación</li>
                                <li>Los pagos pendientes deberán ser completados</li>
                                <li>Perderá acceso inmediato al Servicio</li>
                                <li>Podemos eliminar sus datos después del período de gracia</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Modificaciones a los Términos</h2>
                            <p className="text-gray-700 mb-4">
                                Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios entrarán en vigor
                                30 días después de la publicación de la versión actualizada.
                            </p>
                            <p className="text-gray-700">
                                Le notificaremos sobre cambios significativos por email o a través del Servicio. El uso continuado del
                                Servicio después de la fecha efectiva constituirá aceptación de los términos modificados.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Ley Aplicable</h2>
                            <p className="text-gray-700">
                                Estos términos se regirán e interpretarán de acuerdo con las leyes de España. Cualquier disputa que surja
                                de estos términos será resuelta en los tribunales competentes de España.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Contacto</h2>
                            <p className="text-gray-700 mb-4">
                                Si tiene preguntas sobre estos Términos y Condiciones, puede contactarnos:
                            </p>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-gray-700"><strong>Email:</strong> legal@pix.com</p>
                                <p className="text-gray-700"><strong>Teléfono:</strong> +34 900 123 456</p>
                                <p className="text-gray-700"><strong>Dirección:</strong> Calle Tecnología 123, Madrid, España</p>
                            </div>
                        </section>
                    </div>

                    {/* Acceptance Section */}
                    <div className="mt-12 p-6 bg-blue-50 border border-blue-200 rounded-lg">
                        <h3 className="text-lg font-semibold text-blue-900 mb-4">Confirmación de Aceptación</h3>
                        <p className="text-blue-800 mb-4">
                            Al hacer clic en "Crear Cuenta" durante el proceso de registro, usted confirma que ha leído,
                            entendido y acepta estos Términos y Condiciones de Servicio.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link
                                href="/register"
                                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors text-center"
                            >
                                Aceptar y Continuar con el Registro
                            </Link>
                            <Link
                                href="/"
                                className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors text-center"
                            >
                                Volver al Inicio
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
