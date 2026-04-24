# Checklist de Auditoría de Seguridad - 2026-04-24

## Objetivo
Usar esta checklist para revisar, validar y remediar los riesgos de seguridad actuales de la app por módulo y por capa técnica.

## Estado general
- [x] Confirmar si esta auditoría aplica a entorno local, staging, producción o todos.
- [x] Confirmar qué proyecto(s) de Firebase usa actualmente la app.
- [ ] Confirmar si existe separación real entre entornos dev y prod.

Notas:
- La auditoría actual cubre el repo local y lo deja preparado para validar staging/producción cuando se compartan artefactos externos.
- El proyecto Firebase referenciado en `.env.local` es `personal-os-1b5a5`.

## 1. Auth y control de acceso

### Estado actual
- [x] Revisar [authStore.ts](/home/camilo/dev/Proyectos Personales/Sistema Operativo Personal/personal-os/src/modules/auth/application/store/authStore.ts:1).
- [ ] Confirmar que la app no dependa de `userId: 'dev-user-001'` en ningún entorno real.
- [x] Confirmar si ya existe integración real con Firebase Auth.
- [x] Confirmar si se usa `onAuthStateChanged` o mecanismo equivalente.
- [x] Confirmar si la identidad del usuario viene de una sesión autenticada real y no de estado local editable.

### Riesgos a validar
- [x] Verificar si un usuario puede cambiar el `userId` desde cliente y seguir operando.
- [x] Verificar si existe bypass de autenticación por store local.
- [x] Verificar si las rutas están protegidas para usuarios no autenticados.
- [x] Verificar si existe un estado claro de `loading`, `unauthenticated` y `forbidden`.

Notas:
- `authStore` usa `userId: 'dev-user-001'` por defecto.
- No hay integración visible con `Firebase Auth`.
- No existe `onAuthStateChanged`.
- `AppRouter` no implementa guards ni estados de acceso.

### Remediación
- [ ] Eliminar el usuario hardcodeado de runtime.
- [ ] Implementar autenticación real con Firebase Auth.
- [ ] Asegurar que toda operación derive identidad desde sesión autenticada.
- [ ] Agregar rutas protegidas.

## 2. Firebase y reglas de seguridad

### Artefactos que deben existir
- [x] `firebase.json`
- [x] `.firebaserc`
- [x] `firestore.rules`
- [x] `firestore.indexes.json`
- [x] `storage.rules` si se usa o se usará Storage

Notas:
- Ninguno de estos artefactos existe hoy en el repo.

### Verificación de reglas
- [ ] Confirmar que un usuario no autenticado no pueda leer datos.
- [ ] Confirmar que un usuario no autenticado no pueda escribir datos.
- [ ] Confirmar que un usuario autenticado no pueda leer `users/{otroUserId}/...`.
- [ ] Confirmar que un usuario autenticado no pueda escribir `users/{otroUserId}/...`.
- [ ] Confirmar que las subcolecciones de hábitos, tareas y contextos hereden correctamente el aislamiento por usuario.
- [ ] Confirmar que las reglas impidan cambiar campos sensibles como `userId`.
- [ ] Confirmar que las reglas impidan cambios indebidos a `createdAt`, `stats`, agregados y campos administrativos.
- [ ] Confirmar si existen reglas específicas para colecciones futuras como notas, CRM, finanzas, planner, goals, routines y stats.

### Configuración Firebase
- [ ] Confirmar si App Check está habilitado.
- [ ] Confirmar dominios autorizados de Firebase Auth.
- [ ] Confirmar separación entre proyecto dev y prod.
- [ ] Confirmar que no se estén usando datos reales en entorno de desarrollo.

## 3. Servicios y acceso a Firestore

### Revisión de arquitectura
- [x] Revisar [dbService.ts](/home/camilo/dev/Proyectos Personales/Sistema Operativo Personal/personal-os/src/services/dbService.ts:1).
- [x] Confirmar que el acceso a colecciones no dependa de un `userId` arbitrario pasado desde cliente.
- [x] Confirmar si existe una capa central que derive rutas desde la identidad autenticada.
- [x] Confirmar si los servicios genéricos tienen controles mínimos de defensa en profundidad.

### Riesgos a validar
- [x] Verificar si cualquier servicio puede apuntar a `users/{userId}` con un valor manipulado.
- [x] Verificar si las funciones genéricas de CRUD podrían reutilizarse para acceso cruzado entre usuarios.
- [x] Verificar si `createDocument`, `updateDocument`, `upsertDocument` y `deleteDocument` dependen totalmente de reglas externas.

Notas:
- `dbService` es genérico y no impone ownership.
- Los servicios construyen paths `users/${userId}/...` directamente desde cliente.
- No existe una capa que derive identidad desde sesión autenticada.

### Remediación
- [ ] Centralizar la construcción de rutas seguras por identidad autenticada.
- [ ] Restringir operaciones genéricas sin contexto de usuario autenticado.
- [ ] Agregar validación de ownership en capa cliente como defensa adicional.

## 4. Módulo de Tareas

### Revisión funcional y de seguridad
- [x] Revisar stores, repositories y componentes de tareas.
- [ ] Confirmar que tareas, listas y subtareas queden aisladas por usuario.
- [ ] Confirmar que no se puedan manipular IDs para leer o editar tareas ajenas.
- [ ] Confirmar que `userId`, `createdAt`, `order` y campos sensibles no sean libremente alterables.

### Riesgos específicos
- [x] Revisar [taskRepository.ts](/home/camilo/dev/Proyectos Personales/Sistema Operativo Personal/personal-os/src/modules/tasks/infrastructure/repositories/taskRepository.ts:1).
- [x] Revisar [taskListsRepository.ts](/home/camilo/dev/Proyectos Personales/Sistema Operativo Personal/personal-os/src/modules/tasks/infrastructure/repositories/taskListsRepository.ts:1).
- [x] Revisar [tasksStore.ts](/home/camilo/dev/Proyectos Personales/Sistema Operativo Personal/personal-os/src/modules/tasks/application/store/tasksStore.ts:1).
- [x] Confirmar si la lógica de self-healing debe permanecer en cliente o moverse a administración/CLI.
- [x] Verificar si los errores o logs de tareas exponen payloads sensibles en producción.

### Acciones peligrosas
- [x] Revisar [TasksPageDesktop.tsx](/home/camilo/dev/Proyectos Personales/Sistema Operativo Personal/personal-os/src/modules/tasks/presentation/pages/TasksPageDesktop.tsx:1).
- [x] Confirmar que el botón `[TEST] Ejecutar Seed` no esté disponible en producción.
- [x] Confirmar que `seedTasks.ts` no pueda ser invocado por usuarios finales.
- [ ] Confirmar que `normalizeTasks.ts` no actúe como herramienta administrativa expuesta al usuario final.

Notas:
- `TasksPageDesktop` expone un botón `[TEST] Ejecutar Seed` en UI normal.
- `seedDBWithLists(userId)` borra y recrea tareas del usuario.
- `tasksStore` importa lógica de reparación desde `normalizeTasks.ts`; esto ya fue identificado como algo a mover fuera del cliente.
- Hay logs detallados con payloads en `tasksStore` y `dbService`.

### Remediación
- [ ] Eliminar acciones de mantenimiento de la UI de producción.
- [ ] Dejar seeds y normalizaciones solo en CLI o flujos administrativos protegidos.
- [ ] Añadir validación de esquema para escrituras de tareas.

## 5. Módulo de Hábitos

### Revisión funcional y de seguridad
- [x] Revisar [habit.service.ts](/home/camilo/dev/Proyectos Personales/Sistema Operativo Personal/personal-os/src/services/habit.service.ts:1).
- [x] Revisar [habitLog.service.ts](/home/camilo/dev/Proyectos Personales/Sistema Operativo Personal/personal-os/src/services/habitLog.service.ts:1).
- [x] Revisar [habitsStore.ts](/home/camilo/dev/Proyectos Personales/Sistema Operativo Personal/personal-os/src/modules/habits/application/store/habitsStore.ts:1).
- [ ] Confirmar que hábitos, logs, weeklyStats, monthlyStats y stats/global queden aislados por usuario.

Notas:
- El módulo escribe en múltiples subcolecciones bajo `users/${userId}/habits/...`.
- La protección real depende de reglas externas no auditables desde el repo.

### Riesgos a validar
- [ ] Verificar si un usuario puede manipular `habitId` o `userId` para afectar hábitos ajenos.
- [ ] Verificar si los agregados estadísticos pueden ser alterados por cliente sin restricciones.
- [ ] Verificar si la transacción de logs protege correctamente integridad y ownership.

### Remediación
- [ ] Restringir por reglas todos los paths de stats y subcolecciones.
- [ ] Validar qué campos pueden escribir los clientes directamente.
- [ ] Considerar mover cálculos críticos a backend si el módulo crece en complejidad o sensibilidad.

## 6. Módulo de Contextos

### Revisión
- [x] Revisar [contexts.service.ts](/home/camilo/dev/Proyectos Personales/Sistema Operativo Personal/personal-os/src/modules/contexts/infrastructure/services/contexts.service.ts:1).
- [x] Revisar [contextsStore.ts](/home/camilo/dev/Proyectos Personales/Sistema Operativo Personal/personal-os/src/modules/contexts/application/store/contextsStore.ts:1).
- [ ] Confirmar aislamiento por usuario.
- [ ] Confirmar que no se puedan archivar o editar contextos ajenos.

### Remediación
- [ ] Agregar validación de esquema para creación y actualización.
- [ ] Verificar que `userId` no sea editable por cliente.

## 7. Módulo de Inbox

### Revisión
- [x] Revisar [InboxPage.tsx](/home/camilo/dev/Proyectos Personales/Sistema Operativo Personal/personal-os/src/modules/inbox/presentation/pages/InboxPage.tsx:1).
- [ ] Confirmar que inboxItems queden aislados por usuario.
- [ ] Confirmar que convertir inbox a task no permita corrupción de ownership.

### Riesgos a validar
- [ ] Verificar si un usuario puede borrar inboxItems ajenos manipulando IDs o paths.
- [ ] Verificar si los textos capturados podrían contener contenido que luego se renderice de forma insegura en otros módulos.

## 8. Dashboard y widgets

### Revisión
- [x] Revisar widgets que leen y actualizan tareas y hábitos.
- [x] Confirmar que no expongan datos de otro usuario por estado compartido.
- [x] Confirmar que `localStorage` solo guarde preferencias de baja sensibilidad.

### LocalStorage
- [x] Revisar uso de `dashboard_custom_list_id`.
- [x] Confirmar que no se persistan datos sensibles, tokens o identificadores reutilizables.
- [ ] Definir política de qué sí puede guardarse en local storage.

Notas:
- Solo se encontraron preferencias de UI (`theme`, `dashboard_custom_list_id`) en `localStorage`.
- No se encontraron tokens, secretos o datos de negocio persistidos en storage local durante esta pasada.

## 9. Frontend y renderizado

### XSS e inyección
- [x] Confirmar ausencia de `dangerouslySetInnerHTML`.
- [x] Confirmar ausencia de `innerHTML`.
- [x] Confirmar ausencia de `eval`.
- [x] Confirmar ausencia de `new Function`.
- [x] Revisar si tareas, notas o descripciones se renderizan como texto simple.
- [ ] Revisar de nuevo si más adelante se introduce markdown o rich text.

### Errores y logs
- [x] Verificar si logs actuales exponen payloads sensibles.
- [x] Verificar si errores visibles al usuario revelan estructura interna o detalles innecesarios.
- [ ] Separar logging de desarrollo vs producción.

Notas:
- No hay render HTML peligroso en el repo actual.
- Sí existen `console.error`, `console.info`, `console.log` y un `alert()` de seed en UI.
- Los logs de `tasksStore` y `dbService` pueden incluir payloads completos.

## 10. Scripts y tooling administrativo

### Scripts a revisar
- [x] Revisar [seedTasks.ts](/home/camilo/dev/Proyectos Personales/Sistema Operativo Personal/personal-os/src/scripts/seedTasks.ts:1).
- [x] Revisar [normalizeTasks.ts](/home/camilo/dev/Proyectos Personales/Sistema Operativo Personal/personal-os/src/scripts/normalizeTasks.ts:1).
- [x] Revisar [scripts/normalize-tasks.mjs](/home/camilo/dev/Proyectos Personales/Sistema Operativo Personal/personal-os/scripts/normalize-tasks.mjs:1).

### Controles
- [ ] Confirmar que estos scripts no sean accesibles desde flujos de usuario final.
- [ ] Confirmar que requieran contexto explícito de mantenimiento.
- [ ] Confirmar que no apunten accidentalmente a producción desde entornos de desarrollo.

## 11. Rutas y navegación

### Revisión
- [x] Revisar [AppRouter.tsx](/home/camilo/dev/Proyectos Personales/Sistema Operativo Personal/personal-os/src/routes/AppRouter.tsx:1).
- [x] Confirmar que las rutas privadas no sean accesibles sin autenticación.
- [x] Confirmar si existen guards o wrappers de autorización.

Notas:
- `AppRouter` monta todas las rutas sin protección.
- No se encontraron wrappers de autorización.

### Remediación
- [ ] Implementar rutas protegidas.
- [ ] Mostrar estados correctos para usuarios no autenticados.

## 12. Hallazgos bloqueantes para producción
- [ ] Eliminar el usuario hardcodeado en `authStore`.
- [ ] Versionar reglas y configuración Firebase en el repo.
- [ ] Verificar aislamiento total por usuario en Firestore Rules.
- [ ] Eliminar herramientas destructivas expuestas en UI.
- [ ] Sustituir autorización basada en `userId` cliente por identidad autenticada real.

## 13. Pruebas manuales obligatorias
- [ ] Probar acceso sin autenticar: no debe leer ni escribir nada.
- [ ] Probar usuario A intentando acceder a `users/B/...`.
- [ ] Probar escritura cruzada cambiando `userId` manualmente en cliente.
- [ ] Probar cambio de IDs de documento para leer o borrar datos ajenos.
- [ ] Probar escritura de campos prohibidos como `userId`, `createdAt`, `stats`.
- [ ] Probar si seed o normalización pueden ejecutarse fuera de contexto administrativo.
- [ ] Probar que los logs de producción no expongan payloads completos.

## 14. Prioridad de remediación

### Prioridad 1
- [ ] Auth real
- [ ] Firestore Rules versionadas y auditadas
- [ ] Eliminar `dev-user-001`
- [ ] Eliminar `[TEST] Ejecutar Seed` de UI

### Prioridad 2
- [ ] Rutas protegidas
- [ ] Capa central de acceso basada en identidad autenticada
- [ ] Restricciones de campos sensibles

### Prioridad 3
- [ ] Validaciones de esquema por módulo
- [ ] Logging seguro para producción
- [ ] Política de local storage

### Prioridad 4
- [ ] App Check
- [ ] Revisión de dominios autorizados
- [ ] Revisión de hosting/CSP
- [ ] Tests automatizados de reglas en emulador

## 15. Cierre de auditoría
- [x] Registrar cada hallazgo confirmado con severidad.
- [x] Registrar evidencia técnica por hallazgo.
- [x] Registrar estado de remediación por módulo.
- [ ] Separar hallazgos corregidos, pendientes y aceptados temporalmente.
- [ ] Repetir auditoría después de implementar Auth real y reglas de Firestore.
