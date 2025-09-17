# 🚂 Solución de Problemas de Despliegue en Railway

## Problema Identificado

El despliegue en Railway está fallando porque la aplicación intenta conectarse a PostgreSQL antes de que la base de datos esté completamente iniciada. Esto es común en Railway debido a que los servicios se inician en paralelo.

## ✅ Soluciones Implementadas

### 1. Script de Despliegue Mejorado
- **Archivo**: `scripts/railway-deploy-optimized.js`
- **Mejoras**:
  - ✅ Reintentos aumentados (25 intentos vs 15 anteriores)
  - ✅ Tiempo de espera más largo (hasta 2 minutos)
  - ✅ Configuración automática de connection pooling
  - ✅ Mejor diagnóstico de errores
  - ✅ Modo degradado más robusto

### 2. Script de Test de Conexión Mejorado
- **Archivo**: `scripts/test-db-connection.js`
- **Mejoras**:
  - ✅ Información detallada de la URL de conexión
  - ✅ Diagnóstico de parámetros de conexión
  - ✅ Mensajes de error más descriptivos

### 3. Script de Diagnóstico Completo
- **Archivo**: `scripts/diagnose-db-connection.js`
- **Funciones**:
  - ✅ Verificación completa de configuración
  - ✅ Análisis de parámetros de conexión
  - ✅ Test de permisos de base de datos
  - ✅ Verificación de esquema

## 🚀 Cómo Usar las Soluciones

### Opción 1: Usar el Script Optimizado (Recomendado)

1. **Configurar en Railway**:
   ```bash
   # En las variables de entorno de Railway, establece:
   RAILWAY_DEPLOY_SCRIPT=scripts/railway-deploy-optimized.js
   ```

2. **O modificar package.json**:
   ```json
   {
     "scripts": {
       "railway:deploy": "node scripts/railway-deploy-optimized.js"
     }
   }
   ```

### Opción 2: Configuración Manual de DATABASE_URL

Si prefieres configurar manualmente, agrega estos parámetros a tu `DATABASE_URL` en Railway:

```env
DATABASE_URL="postgresql://user:pass@postgres.railway.internal:5432/db?connection_limit=3&pool_timeout=20&connect_timeout=10&socket_timeout=30&keepalives=1&keepalives_idle=30&keepalives_interval=10&keepalives_count=3"
```

### Opción 3: Ejecutar Diagnóstico

Para diagnosticar problemas de conexión:

```bash
# Ejecutar diagnóstico completo
node scripts/diagnose-db-connection.js

# O usar el script mejorado de test
node scripts/test-db-connection.js
```

## 🔧 Configuración en Railway

### Variables de Entorno Recomendadas

```env
# Base de datos
DATABASE_URL=postgresql://user:pass@postgres.railway.internal:5432/db

# Configuración de despliegue
NODE_ENV=production
RUN_SEED=false

# Health checks
HEALTH_CHECK_TIMEOUT=30
```

### Health Check Configuration

El endpoint `/api/health` ya está configurado para:
- ✅ Retornar estado "degraded" cuando la DB no está disponible
- ✅ Permitir que Railway no mate el contenedor
- ✅ Proporcionar información detallada de diagnóstico

## 📊 Monitoreo y Troubleshooting

### Comandos Útiles

```bash
# Ver logs de Railway
railway logs

# Ver estado de servicios
railway status

# Reiniciar servicios
railway restart
```

### Posibles Problemas y Soluciones

#### ❌ "Can't reach database server"
**Solución**: Verificar que la DB esté ejecutándose en Railway y que la URL sea correcta.

#### ❌ "too many clients already"
**Solución**: Los parámetros de connection pooling ya están configurados para evitar esto.

#### ❌ Timeout de conexión
**Solución**: Los timeouts han sido aumentados y optimizados.

#### ❌ Health checks fallan
**Solución**: El health check permite estado degradado, así que la app debería iniciar.

## 🎯 Próximos Pasos

1. **Probar el despliegue** con el script optimizado
2. **Monitorear los logs** durante el startup
3. **Verificar el health check** en `/api/health`
4. **Confirmar** que la aplicación funciona correctamente

## 📞 Soporte

Si los problemas persisten:

1. Ejecuta el diagnóstico: `node scripts/diagnose-db-connection.js`
2. Revisa los logs de Railway
3. Verifica la configuración de la base de datos en Railway
4. Contacta soporte de Railway si es necesario

---

**✅ Resultado Esperado**: Despliegue exitoso con conexión estable a PostgreSQL y mejor tolerancia a fallos temporales.