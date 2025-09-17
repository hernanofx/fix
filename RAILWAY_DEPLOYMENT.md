# 🚂 Guía de Despliegue en Railway

Esta guía te ayudará a resolver los problemas comunes de despliegue en Railway, especialmente relacionados con conexiones a PostgreSQL y límites de clientes.

## 🔧 Problemas Comunes y Soluciones

### ❌ Error: "too many clients already"

**Síntomas:**
- El despliegue falla con errores de conexión a PostgreSQL
- Mensajes como "FATAL: too many clients already"
- Health checks fallan durante el startup

**Soluciones:**

1. **Configurar Pool de Conexiones en Railway:**
   ```bash
   # En las variables de entorno de Railway, agrega:
   DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=5&pool_timeout=0"
   ```

2. **Aumentar el límite de conexiones en PostgreSQL:**
   ```sql
   -- Ejecutar en tu base de datos PostgreSQL:
   ALTER SYSTEM SET max_connections = '50';
   SELECT pg_reload_conf();
   ```

3. **Configurar PgBouncer (recomendado para Railway):**
   - Railway tiene límites estrictos de conexión
   - Usa un connection pooler como PgBouncer
   - Configura `max_client_conn` y `default_pool_size`

### ⚠️ Health Checks Fallan

**Problema:** Railway mata el contenedor si los health checks fallan.

**Soluciones implementadas:**
- ✅ Health check más tolerante (5 minutos de start period)
- ✅ Endpoint `/api/health` que permite estado "degraded"
- ✅ Reintentos automáticos de conexión a base de datos
- ✅ Modo degradado cuando la DB no está disponible

### 🗄️ Inicialización de Base de Datos

**Script optimizado:** `scripts/railway-deploy.js`
- Reintentos con backoff exponencial
- Verificación de conexión antes de aplicar esquema
- Modo degradado si la DB no está disponible
- Timeouts apropiados para Railway

## 🚀 Comandos Útiles

### Diagnóstico
```bash
# Ejecutar diagnóstico completo
npm run diagnose:db

# Verificar estado de Railway
npm run diagnose
```

### Desarrollo Local
```bash
# Iniciar con configuración de producción
npm run start

# Iniciar en modo desarrollo
npm run dev
```

### Base de Datos
```bash
# Aplicar esquema
npm run db:push

# Ejecutar seeding
npm run db:seed

# Abrir Prisma Studio
npm run db:studio
```

## 📊 Monitoreo y Debugging

### Logs Importantes
- Busca mensajes de "too many clients"
- Verifica timeouts de conexión
- Monitorea uso de memoria (Railway tiene límites)

### Variables de Entorno Críticas
```env
DATABASE_URL=postgresql://...
NODE_ENV=production
PORT=3000
RUN_SEED=false
```

### Health Check Endpoint
- URL: `https://tu-app.railway.app/api/health`
- Retorna estado de la aplicación y base de datos
- Estado "degraded" es aceptable durante startup

## 🔄 Estrategia de Despliegue

1. **Pre-despliegue:**
   - Verificar `DATABASE_URL`
   - Ejecutar `npm run diagnose:db` localmente
   - Asegurar que el esquema esté actualizado

2. **Durante despliegue:**
   - Railway ejecuta automáticamente `scripts/railway-deploy.js`
   - Espera hasta 5 minutos para que la DB esté disponible
   - Aplica esquema y seeding si es posible

3. **Post-despliegue:**
   - Verificar health check: `/api/health`
   - Monitorear logs por errores de conexión
   - Verificar que la aplicación responda

## 🛠️ Troubleshooting Avanzado

### Si el despliegue sigue fallando:

1. **Verificar límites de Railway:**
   - Revisa el plan actual de Railway
   - Considera upgrade si tienes muchos proyectos

2. **Optimizar consultas:**
   - Usa `connection_limit` en DATABASE_URL
   - Implementa connection pooling en la aplicación

3. **Configurar timeouts apropiados:**
   ```env
   DATABASE_URL="postgresql://...?connect_timeout=10&socket_timeout=30"
   ```

4. **Usar Redis para cache:**
   - Reduce carga en PostgreSQL
   - Implementa cache de sesiones y datos frecuentes

### Contacto de Soporte
- **Railway Support:** Para problemas específicos de la plataforma
- **PostgreSQL Docs:** Para configuración de conexión
- **Proyecto Fix:** Para problemas específicos de la aplicación

## ✅ Checklist de Despliegue

- [ ] DATABASE_URL configurada correctamente
- [ ] Connection limit apropiado (≤5 para Railway)
- [ ] Health check endpoint funcionando
- [ ] Scripts de inicialización ejecutables
- [ ] Variables de entorno críticas configuradas
- [ ] Build de Next.js exitoso
- [ ] Logs de Railway monitoreados

---

**🎯 Resultado Esperado:** Despliegue exitoso con manejo robusto de conexiones a PostgreSQL y recuperación automática de fallos temporales.