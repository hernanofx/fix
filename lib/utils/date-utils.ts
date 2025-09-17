/**
 * Utilidades para formateo de fechas con zona horaria de Argentina
 */

/**
 * Formatea una fecha en la zona horaria de Argentina (UTC-3)
 * @param date - Fecha a formatear
 * @param options - Opciones de formateo
 * @returns Fecha formateada en zona horaria de Argentina
 */
export function formatDateArgentina(
    date: Date | string | number,
    options: Intl.DateTimeFormatOptions = {}
): string {
    const dateObj = new Date(date);

    // Configuración por defecto para Argentina
    const defaultOptions: Intl.DateTimeFormatOptions = {
        timeZone: 'America/Argentina/Buenos_Aires',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        ...options
    };

    return dateObj.toLocaleDateString('es-AR', defaultOptions);
}

/**
 * Formatea una fecha y hora en la zona horaria de Argentina
 * @param date - Fecha a formatear
 * @param options - Opciones de formateo
 * @returns Fecha y hora formateada en zona horaria de Argentina
 */
export function formatDateTimeArgentina(
    date: Date | string | number,
    options: Intl.DateTimeFormatOptions = {}
): string {
    const dateObj = new Date(date);

    // Configuración por defecto para Argentina con hora
    const defaultOptions: Intl.DateTimeFormatOptions = {
        timeZone: 'America/Argentina/Buenos_Aires',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        ...options
    };

    return dateObj.toLocaleString('es-AR', defaultOptions);
}

/**
 * Obtiene la fecha actual en zona horaria de Argentina
 * @returns Fecha actual en Argentina
 */
export function getCurrentDateArgentina(): Date {
    // Crear una nueva fecha UTC
    const now = new Date();

    // Obtener el offset de Argentina (-3 horas desde UTC)
    const argentineOffset = -3 * 60; // -180 minutes
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const argentineTime = new Date(utc + (argentineOffset * 60000));

    return argentineTime;
}

/**
 * Convierte una fecha a la zona horaria de Argentina
 * @param date - Fecha a convertir
 * @returns Fecha convertida a zona horaria de Argentina
 */
export function toArgentinaTimezone(date: Date | string | number): Date {
    const dateObj = new Date(date);

    // Crear fecha en zona horaria de Argentina
    const argentineTime = new Date(
        dateObj.toLocaleString('en-US', {
            timeZone: 'America/Argentina/Buenos_Aires'
        })
    );

    return argentineTime;
}

/**
 * Formatea una fecha para mostrar en formularios (YYYY-MM-DD)
 * @param date - Fecha a formatear
 * @returns Fecha en formato YYYY-MM-DD
 */
export function formatDateForInput(date: Date | string | number): string {
    const dateObj = toArgentinaTimezone(date);
    return dateObj.toISOString().split('T')[0];
}

/**
 * Formatea una fecha de manera amigable para el usuario argentino
 * @param date - Fecha a formatear
 * @returns Fecha formateada de manera amigable
 */
export function formatDateFriendly(date: Date | string | number): string {
    return formatDateArgentina(date, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

/**
 * Calcula la diferencia en días entre dos fechas
 * @param date1 - Primera fecha
 * @param date2 - Segunda fecha
 * @returns Diferencia en días
 */
export function daysDifference(date1: Date | string | number, date2: Date | string | number): number {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const timeDiff = Math.abs(d2.getTime() - d1.getTime());
    return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
}
