# Sistema Operativo Personal - Requerimientos Técnicos

## 📋 Índice de Fases de Desarrollo

- [Fase 0: Fundamentos y Arquitectura](#fase-0-fundamentos-y-arquitectura)
- [Fase 1: Dashboard Central](#fase-1-dashboard-central)
- [Fase 2: Habit Tracker](#fase-2-habit-tracker)
- [Fase 3: Sistema de Tareas (To-Do)](#fase-3-sistema-de-tareas-to-do)
- [Fase 4: Inbox (Captura Rápida)](#fase-4-inbox-captura-rápida)
- [Fase 5: CRM Freelance](#fase-5-crm-freelance)
- [Fase 6: Finanzas](#fase-6-finanzas)
- [Fase 7: Planner (Diario/Semanal)](#fase-7-planner-diariosemanal)
- [Fase 8: Objetivos (Goals)](#fase-8-objetivos-goals)
- [Fase 9: Notas e Ideas](#fase-9-notas-e-ideas)
- [Fase 10: Rutinas](#fase-10-rutinas)
- [Fase 11: Sistema de Estadísticas](#fase-11-sistema-de-estadísticas)
- [Fase 12: Optimización y PWA](#fase-12-optimización-y-pwa)

---

## Fase 0: Fundamentos y Arquitectura

**Objetivo**: Establecer la base técnica y estructura del proyecto antes de desarrollar funcionalidades.

### Stack Tecnológico

#### Frontend
- **Framework**: React 18+
- **Build Tool**: Vite
- **Routing**: React Router v6
- **Styling**: Tailwind CSS + CSS Modules (según necesidad)
- **State Management**: 
  - Context API para estado global simple
  - React Query para manejo de datos de Firebase
- **UI Components**: shadcn/ui o biblioteca similar (opcional)
- **Iconos**: Lucide React

#### Backend
- **BaaS**: Firebase
  - **Authentication**: Firebase Auth (Email/Password + Google OAuth)
  - **Database**: Cloud Firestore
  - **Hosting**: Firebase Hosting
  - **Functions**: Cloud Functions (para cálculos de estadísticas)

#### PWA
- **Service Worker**: Workbox
- **Manifest**: Web App Manifest para instalación en iOS/Android

### Estructura del Proyecto


### Configuración Inicial de Firebase

#### Firestore - Colecciones Base

```javascript
// Estructura de colecciones principales
users/{userId}/
  profile/
    name
    email
    createdAt
    settings

  habits/{habitId}/
    name
    type
    createdAt
    isActive

  habit_logs/{logId}/
    habitId
    completedAt
    date (YYYY-MM-DD)

  tasks/{taskId}/
    title
    priority
    status
    dueDate
    createdAt

  inbox_items/{itemId}/
    content
    type
    processed
    createdAt

  clients/{clientId}/
    name
    email
    status
    createdAt

  projects/{projectId}/
    clientId
    name
    status
    budget
    startDate

  financial_records/{recordId}/
    type
    amount
    category
    date
    projectId
    description

  goals/{goalId}/
    title
    type
    targetDate
    progress

  notes/{noteId}/
    title
    content
    tags
    createdAt

  routines/{routineId}/
    name
    habitIds
    timeOfDay

  stats/
    monthly/{year-month}
    weekly/{year-week}
    yearly/{year}
```

### Reglas de Seguridad de Firestore (Inicial)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper para verificar autenticación
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper para verificar ownership
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // Regla general: solo el usuario puede leer/escribir sus propios datos
    match /users/{userId}/{document=**} {
      allow read, write: if isOwner(userId);
    }
  }
}
```

### Autenticación - Setup Inicial

#### Auth Provider Configuration
1. Email/Password habilitado
2. Google Sign-In habilitado
3. Configurar dominio autorizado para PWA

#### User Creation Flow
```javascript
// Al crear usuario, inicializar documento en Firestore
async function createUserProfile(user) {
  await setDoc(doc(db, 'users', user.uid, 'profile', 'data'), {
    name: user.displayName || '',
    email: user.email,
    createdAt: serverTimestamp(),
    settings: {
      theme: 'light',
      language: 'es'
    }
  });
}
```

### Layout Base

#### Componentes Principales
1. **AppShell**
   - Sidebar navegación
   - Header con usuario
   - Área de contenido principal
   - Responsive (móvil/desktop)

2. **Sidebar**
   - Links a módulos principales
   - Dashboard (home)
   - Módulos (Hábitos, Tareas, CRM, etc.)
   - Configuración

3. **Header**
   - Título de sección actual
   - Avatar/menú de usuario
   - Botón de búsqueda rápida (futuro)

### Navegación

```javascript
// Rutas principales
const routes = [
  { path: '/', component: Dashboard, label: 'Dashboard' },
  { path: '/habits', component: Habits, label: 'Hábitos' },
  { path: '/tasks', component: Tasks, label: 'Tareas' },
  { path: '/inbox', component: Inbox, label: 'Inbox' },
  { path: '/crm', component: CRM, label: 'CRM' },
  { path: '/finance', component: Finance, label: 'Finanzas' },
  { path: '/planner', component: Planner, label: 'Planner' },
  { path: '/goals', component: Goals, label: 'Objetivos' },
  { path: '/notes', component: Notes, label: 'Notas' },
  { path: '/routines', component: Routines, label: 'Rutinas' },
  { path: '/stats', component: Stats, label: 'Estadísticas' },
];
```

### Theme y Diseño

#### Paleta de Colores Base
```css
:root {
  --primary: #2563eb;      /* Azul principal */
  --secondary: #64748b;    /* Gris secundario */
  --success: #10b981;      /* Verde éxito */
  --warning: #f59e0b;      /* Amarillo warning */
  --danger: #ef4444;       /* Rojo danger */
  --background: #ffffff;   /* Fondo principal */
  --surface: #f8fafc;      /* Superficie cards */
  --text-primary: #0f172a; /* Texto principal */
  --text-secondary: #64748b; /* Texto secundario */
}

[data-theme="dark"] {
  --background: #0f172a;
  --surface: #1e293b;
  --text-primary: #f1f5f9;
  --text-secondary: #94a3b8;
}
```

#### Principios de Diseño
- **Inspiración Visual Base**: El diseño debe basarse estrictamente en la estética de `_plan de trabajo/_interfaz/image.png`.
  - **Uso Crítico**: *No se debe copiar la información ni los widgets textualmente*, sino la "vibra" (vibe) visual.
  - **Estilos a replicar**: 
    - Fondos neutros y limpios (`#f9fafb` o similar para el fondo principal, puro blanco para las tarjetas).
    - Menús activos con forma de "píldora" (pill-shaped `rounded-full` o `rounded-xl`) y color primario vibrante.
    - Esquinas muy redondeadas en todas las tarjetas (`rounded-2xl`).
    - Sombras muy tenues pero amplias (`shadow-sm` o sombras suaves) sin bordes duros.
    - Uso de colores pasteles cálidos muy sutiles para tarjetas informativas de primer nivel (rojo claro, naranja claro, verde claro, morado claro).
    - Tipografía moderna e iconos redondeados.
- **Velocidad visual**: Jerarquía clara, información en primer nivel
- **Escaneo rápido**: Typography clara, espaciado consistente
- **Acciones inmediatas**: Botones de acción rápida visibles
- **Desktop-first**: Diseñar primero para desktop, expandir a móvil

### Checklist de Completitud - Fase 0

- [x] Proyecto React + Vite configurado
- [x] Firebase proyecto creado y configurado
- [ ] Firestore con colecciones base inicializadas (solo habits, habitLogs, contexts)
- [ ] Firebase Auth configurado (Email + Google) — userId hardcodeado
- [x] Estructura de carpetas implementada
- [x] Layout base (AppShell, Sidebar, Header) funcional
- [x] Routing básico implementado
- [x] Theme system (light/dark) funcional
- [ ] Reglas de seguridad de Firestore básicas
- [ ] Login/Signup flows implementados
- [ ] User profile creation automática
- [ ] Responsive design validado en móvil y desktop

### Entregables de Fase 0
1. Aplicación con login funcional
2. Dashboard vacío (placeholder)
3. Navegación entre módulos (páginas vacías)
4. Firestore inicializado y conectado
5. Deployment en Firebase Hosting

---

## Fase 1: Dashboard Central

**Objetivo**: Crear el hub central que muestra el estado general del sistema en menos de 3 segundos.

### Concepto
El Dashboard es la página de inicio y el punto central de la aplicación. Debe responder a la pregunta: **"¿Cómo va mi día/semana?"** de manera visual e inmediata.

### Componentes del Dashboard

#### 1. Header del Dashboard
```javascript
// Información mostrada
{
  greeting: "Buenos días, [Nombre]",
  currentDate: "Lunes, 8 de Abril 2026",
  quickStats: {
    habitsToday: "3/5 completados",
    pendingTasks: "7 pendientes",
    focusMode: false // Toggle para modo enfoque
  }
}
```

#### 2. Widget: Hábitos del Día
**Posición**: Top-left, primera cosa que se ve

**Datos mostrados**:
- Lista de hábitos para hoy
- Checkbox para marcar como completado
- Indicador de racha actual
- Barra de progreso del día

**Interacciones**:
- Click en checkbox → marca hábito como completado
- Click en hábito → muestra detalle/historial
- Animación visual al completar

**Tamaño**: 1/3 del ancho en desktop, full-width en móvil

#### 3. Widget: Tareas Prioritarias
**Posición**: Top-center

**Datos mostrados**:
- Top 5 tareas más prioritarias
- Tareas con fecha de hoy
- Indicador visual de prioridad (color)
- Quick actions: completar, postponer

**Interacciones**:
- Click en tarea → marca como completada
- Arrastrar para reordenar prioridades
- Botón "+" para agregar tarea rápida

**Tamaño**: 1/3 del ancho en desktop

#### 4. Widget: Actividad Reciente
**Posición**: Top-right

**Datos mostrados**:
- Últimas 5-10 acciones del sistema
- Timeline visual
- Tipos: hábito completado, tarea creada, proyecto actualizado, ingreso registrado

**Formato**:
```javascript
{
  type: 'habit_completed',
  timestamp: '14:30',
  description: 'Completaste: Meditación',
  icon: '✅'
}
```

#### 5. Widget: Métricas Clave (KPIs)
**Posición**: Middle-section, full-width

**Cards de métricas** (4 cards horizontales):

1. **Productividad Semanal**
   - Porcentaje de hábitos completados
   - Mini gráfico de tendencia (7 días)
   - Color: Verde si >70%, amarillo si 50-70%, rojo si <50%

2. **Ingresos del Mes**
   - Total ingresos mes actual
   - Comparación con mes anterior (+/- %)
   - Proyección para fin de mes

3. **Proyectos Activos**
   - Número de proyectos en curso
   - Proyectos por cerrar esta semana
   - Quick link a CRM

4. **Progreso de Objetivos**
   - Objetivo principal del mes
   - Barra de progreso
   - Días restantes

**Design pattern**: Cards con icono, valor grande, label pequeño, y mini chart

#### 6. Widget: Planner de Hoy
**Posición**: Bottom-left

**Funcionalidad**:
- Vista de bloques de tiempo (opcional)
- Top 3 prioridades del día
- Bloques de rutinas (mañana/tarde/noche)
- Edición rápida inline

#### 7. Widget: Inbox Counter
**Posición**: Bottom-right (pequeño)

**Datos**:
- Número de items sin procesar
- Badge de notificación si >5 items
- Click directo a Inbox

#### 8. Quick Actions Bar
**Posición**: Sticky bottom (móvil) o sidebar (desktop)

**Botones de acción rápida**:
- ➕ Nueva tarea
- 📝 Capturar idea (Inbox)
- ✅ Log hábito
- 💰 Registrar ingreso/gasto

### Estructura de Datos

```javascript
// Dashboard data structure
const dashboardData = {
  user: {
    name: string,
    greeting: string,
    currentDate: string
  },
  
  habitsToday: [
    {
      id: string,
      name: string,
      completed: boolean,
      streak: number,
      icon: string
    }
  ],
  
  priorityTasks: [
    {
      id: string,
      title: string,
      priority: 'high' | 'medium' | 'low',
      dueDate: timestamp | null,
      completed: boolean
    }
  ],
  
  recentActivity: [
    {
      type: string,
      timestamp: timestamp,
      description: string,
      icon: string,
      relatedId: string
    }
  ],
  
  kpis: {
    productivity: {
      value: number (0-100),
      trend: 'up' | 'down' | 'stable',
      weeklyData: [number]
    },
    monthlyIncome: {
      current: number,
      previous: number,
      projection: number
    },
    activeProjects: {
      total: number,
      closingSoon: number
    },
    mainGoal: {
      title: string,
      progress: number (0-100),
      daysLeft: number
    }
  },
  
  todayPlanner: {
    topPriorities: [string],
    morningRoutine: boolean,
    eveningRoutine: boolean
  },
  
  inboxCount: number
}
```

### Queries de Firestore

```javascript
// Hook para obtener datos del dashboard
function useDashboardData(userId) {
  // Hábitos de hoy
  const habitsQuery = query(
    collection(db, `users/${userId}/habits`),
    where('isActive', '==', true),
    where('type', 'in', ['daily', getWeekday()])
  );
  
  // Tareas prioritarias
  const tasksQuery = query(
    collection(db, `users/${userId}/tasks`),
    where('status', '==', 'pending'),
    orderBy('priority', 'desc'),
    limit(5)
  );
  
  // Actividad reciente
  const activityQuery = query(
    collection(db, `users/${userId}/activity_log`),
    orderBy('timestamp', 'desc'),
    limit(10)
  );
  
  // KPIs desde stats precalculadas
  const currentWeek = getWeekNumber();
  const currentMonth = getMonthKey(); // "2026-04"
  
  const kpisData = {
    weeklyStats: doc(db, `users/${userId}/stats_weekly/${currentWeek}`),
    monthlyStats: doc(db, `users/${userId}/stats_monthly/${currentMonth}`)
  };
  
  // Inbox count
  const inboxQuery = query(
    collection(db, `users/${userId}/inbox_items`),
    where('processed', '==', false)
  );
  
  return { habitsQuery, tasksQuery, activityQuery, kpisData, inboxQuery };
}
```

### Optimización de Rendimiento

#### Estrategias:
1. **React Query** para cache de queries
2. **Lazy loading** de widgets no críticos
3. **Skeleton loaders** mientras carga data
4. **Memoización** de cálculos complejos
5. **Debounce** en actualizaciones en tiempo real

#### Prioridad de Carga:
1. Header + Hábitos del día (crítico)
2. Tareas prioritarias
3. KPIs
4. Actividad reciente
5. Resto de widgets

### Responsive Design

#### Mobile (< 768px)
- Stack vertical de widgets
- Hábitos → Tareas → KPIs → Planner → Activity
- Quick Actions como bottom bar sticky
- Swipe entre secciones (opcional)

#### Tablet (768px - 1024px)
- Grid de 2 columnas
- Hábitos + Tareas arriba
- KPIs full-width
- Activity + Planner abajo

#### Desktop (> 1024px)
- Grid de 3 columnas
- Layout completo como diseñado
- Sidebar persistente
- Hover effects y tooltips

### Interactividad

#### Micro-interactions
- ✅ Confetti o animación al completar hábito
- ✨ Pulse effect al actualizar KPI
- 🎯 Highlight de tarea urgente
- 📊 Animación de gráficos al cargar

#### Gestures (móvil)
- Swipe right en tarea → completar
- Swipe left en tarea → eliminar
- Pull to refresh en dashboard

### Checklist de Completitud - Fase 1

- [x] Header del dashboard con saludo y fecha
- [x] Widget de hábitos del día funcional (datos reales de Firestore)
- [ ] Widget de tareas prioritarias con quick actions (mock data)
- [ ] Widget de actividad reciente con timeline (mock data)
- [ ] 4 Cards de KPIs con datos reales (mock data — solo hábitos tiene datos reales)
- [x] Widget de planner básico
- [ ] Contador de inbox (badge hardcodeado)
- [x] Quick actions bar (bottom/sidebar)
- [ ] Queries optimizadas con React Query (usa Zustand directo)
- [ ] Skeleton loaders implementados
- [ ] Responsive design validado (móvil/tablet/desktop)
- [x] Micro-interactions al completar acciones
- [x] Animaciones de carga suaves
- [ ] Pull to refresh (móvil)

### Entregables de Fase 1
1. Dashboard completamente funcional
2. Integración con Firebase para datos reales
3. Diseño responsive validado en dispositivos
4. Performance <2s para carga inicial
5. Sistema de cache funcional

---

## Fase 2: Habit Tracker

**Objetivo**: Sistema completo de seguimiento de hábitos con soporte para hábitos diarios y semanales, registro de rachas, y visualización histórica.

### Conceptos Clave

#### Tipos de Hábitos
1. **Diarios**: Se deben completar todos los días
2. **Semanales**: Se pueden completar cualquier día de la semana (ej: "Ir al gym 3 veces")

#### Streak (Racha)
- Contador de días/semanas consecutivas completando el hábito
- Se rompe si no se completa en el período esperado
- Puede tener "días de gracia" (opcional)

### Modelo de Datos

```javascript
// Colección: users/{userId}/habits/{habitId}
{
  id: string,
  name: string,
  description: string (opcional),
  type: 'daily' | 'weekly',
  weeklyTarget: number (solo para weekly, ej: 3),
  icon: string (emoji o lucide icon name),
  color: string (hex color),
  createdAt: timestamp,
  isActive: boolean,
  category: string (ej: 'health', 'work', 'personal'),
  reminderTime: string | null (HH:mm formato),
  
  // Configuración de racha
  allowGraceDays: boolean,
  graceDays: number (default: 0)
}

// Colección: users/{userId}/habit_logs/{logId}
{
  id: string,
  habitId: string,
  completedAt: timestamp,
  date: string (YYYY-MM-DD),
  week: string (YYYY-Wxx), // Para hábitos semanales
  note: string (opcional, para agregar contexto)
}

// Documento calculado: users/{userId}/habit_stats/{habitId}
{
  habitId: string,
  currentStreak: number,
  longestStreak: number,
  totalCompletions: number,
  lastCompletedAt: timestamp,
  completionRate: number (0-100, últimos 30 días),
  updatedAt: timestamp
}
```

### Vistas Principales

#### 1. Vista: Lista de Hábitos

**Layout**: Lista/Grid de cards de hábitos

**Card de Hábito (Diario)**:
```
┌─────────────────────────────────────┐
│ [Icon] Meditación              [✓]  │
│ 🔥 15 días de racha                 │
│ ████████░░ 80% (30d)                │
└─────────────────────────────────────┘
```

**Card de Hábito (Semanal)**:
```
┌─────────────────────────────────────┐
│ [Icon] Gimnasio 3x semana      [✓]  │
│ 🔥 4 semanas de racha               │
│ Esta semana: ●●○ (2/3)              │
│ ████████░░ 75% (12w)                │
└─────────────────────────────────────┘
```

**Elementos del Card**:
- Icono y nombre
- Checkbox para hoy (diarios) o contador (semanales)
- Indicador de racha actual
- Barra de progreso (completion rate)
- Badge de categoría
- Menu de opciones (editar, ver historial, archivar)

**Acciones**:
- Click en checkbox → registra completitud de hoy
- Click en card → abre modal de detalle/historial
- Swipe (móvil) → quick actions

#### 2. Vista: Detalle de Hábito

**Secciones**:

1. **Header**
   - Nombre, icono, descripción
   - Stats principales (racha, total completado, %)
   - Botón editar

2. **Calendario/Heatmap**
   - Vista mensual con días completados marcados
   - Color intensity según consistencia
   - Navegación entre meses

3. **Gráfica de Consistencia**
   - Line chart de últimos 30/90 días
   - Muestra tendencia
   - Marca días no completados

4. **Historial de Logs**
   - Lista cronológica de completitudes
   - Filtros por rango de fecha
   - Notas asociadas (si las hay)

5. **Análisis**
   - Mejor racha histórica
   - Día de la semana con mejor completion rate
   - Patrones identificados (ej: "Completado 90% los lunes")

#### 3. Modal: Crear/Editar Hábito

**Campos del Form**:
```javascript
{
  name: string (requerido),
  description: string,
  type: 'daily' | 'weekly' (requerido),
  weeklyTarget: number (si es weekly),
  icon: string (selector de emojis o iconos),
  color: string (color picker),
  category: string (dropdown o custom),
  reminderTime: time (opcional),
  allowGraceDays: boolean,
  graceDays: number
}
```

**Validaciones**:
- Nombre no vacío
- weeklyTarget entre 1-7 si es weekly
- Color en formato hex válido

#### 4. Vista: Categorías

**Funcionalidad**:
- Agrupar hábitos por categoría
- Vista tipo tabs o accordion
- Drag & drop para reorganizar
- Estadísticas por categoría

**Categorías default**:
- 💪 Salud
- 🧠 Productividad
- 🎨 Creatividad
- 💼 Trabajo
- 🧘 Bienestar
- 📚 Aprendizaje
- 🎯 Personalizado

### Lógica de Negocio

#### Cálculo de Rachas

```javascript
// Pseudocódigo para calcular racha de hábito diario
function calculateDailyStreak(habitId, userId) {
  const logs = await getHabitLogs(habitId, orderBy('date', 'desc'));
  const today = formatDate(new Date());
  
  let streak = 0;
  let currentDate = today;
  
  for (const log of logs) {
    if (log.date === currentDate) {
      streak++;
      currentDate = getPreviousDay(currentDate);
    } else if (isWithinGracePeriod(currentDate, log.date, graceDays)) {
      // Continúa la racha por gracia
      currentDate = getPreviousDay(log.date);
    } else {
      break; // Racha rota
    }
  }
  
  return streak;
}

// Para hábitos semanales
function calculateWeeklyStreak(habitId, userId, weeklyTarget) {
  const logs = await getHabitLogs(habitId, orderBy('week', 'desc'));
  const currentWeek = getWeekNumber();
  
  const weekGroups = groupBy(logs, 'week');
  let streak = 0;
  let currentWeek = getCurrentWeek();
  
  while (weekGroups[currentWeek]?.length >= weeklyTarget) {
    streak++;
    currentWeek = getPreviousWeek(currentWeek);
  }
  
  return streak;
}
```

#### Registro de Completitud

```javascript
async function logHabitCompletion(habitId, userId, note = '') {
  const today = formatDate(new Date());
  const currentWeek = getWeekNumber();
  
  // Verificar si ya existe log para hoy
  const existingLog = await getLogForDate(habitId, today);
  if (existingLog) {
    throw new Error('Habit already logged for today');
  }
  
  // Crear log
  const logRef = doc(collection(db, `users/${userId}/habit_logs`));
  await setDoc(logRef, {
    habitId,
    completedAt: serverTimestamp(),
    date: today,
    week: currentWeek,
    note
  });
  
  // Actualizar estadísticas (puede ser una Cloud Function)
  await updateHabitStats(habitId, userId);
  
  // Registrar actividad en dashboard
  await logActivity(userId, {
    type: 'habit_completed',
    description: `Completaste: ${habitName}`,
    relatedId: habitId
  });
}
```

#### Actualización de Estadísticas

```javascript
// Cloud Function que se ejecuta al crear log
async function updateHabitStats(habitId, userId) {
  const stats = await calculateHabitStats(habitId, userId);
  
  await setDoc(
    doc(db, `users/${userId}/habit_stats/${habitId}`),
    {
      ...stats,
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
}
```

### Funcionalidades Adicionales

#### 1. Sistema de Recordatorios
- Notificaciones push (PWA) a hora configurada
- Solo si hábito no completado aún
- Toggle on/off por hábito

#### 2. Archivar Hábitos
- Hábitos inactivos no se muestran en lista principal
- Mantienen su historial
- Se pueden restaurar

#### 3. Templates de Hábitos
- Hábitos populares predefinidos
- Quick start para nuevos usuarios
- Ej: "Beber agua", "Ejercicio", "Meditar"

#### 4. Modo Enfoque
- Vista minimalista solo con hábitos de hoy
- Sin distracciones
- Timer integrado (opcional)

### Queries y Subscriptions

```javascript
// Hook principal de hábitos
function useHabits(userId) {
  // Hábitos activos
  const activeHabitsQuery = query(
    collection(db, `users/${userId}/habits`),
    where('isActive', '==', true),
    orderBy('createdAt', 'desc')
  );
  
  const { data: habits } = useFirestoreQuery(activeHabitsQuery);
  
  return habits;
}

// Hook para logs de hoy
function useTodayLogs(userId) {
  const today = formatDate(new Date());
  
  const todayLogsQuery = query(
    collection(db, `users/${userId}/habit_logs`),
    where('date', '==', today)
  );
  
  const { data: logs } = useFirestoreQuery(todayLogsQuery);
  
  return logs;
}

// Hook para stats de un hábito
function useHabitStats(habitId, userId) {
  const statsDoc = doc(db, `users/${userId}/habit_stats/${habitId}`);
  const { data: stats } = useFirestoreDocument(statsDoc);
  
  return stats;
}
```

### Diseño de Interfaz

#### Colores y Estados
```css
.habit-completed {
  background: var(--success);
  opacity: 0.7;
}

.habit-pending {
  background: var(--surface);
  border: 2px dashed var(--secondary);
}

.habit-missed {
  background: var(--danger);
  opacity: 0.3;
}

.streak-fire {
  color: #ff6b35; /* Fuego naranja */
}
```

#### Animaciones
- ✅ Checkmark animado al completar
- 🔥 Flame icon con pulse en rachas largas (>7 días)
- 📊 Barra de progreso con transición suave
- 🎉 Confetti al alcanzar milestone (racha de 30, 100 días)

### Checklist de Completitud - Fase 2

- [x] Modelo de datos implementado en Firestore
- [x] CRUD de hábitos (crear, editar, archivar/eliminar)
- [x] Vista de lista de hábitos (cards)
- [x] Registro de completitud (daily y weekly)
- [ ] Cálculo automático de rachas — migrado a consistencia mensual
- [x] Vista de detalle de hábito
- [x] Calendario/heatmap de completitud
- [ ] Gráfica de consistencia
- [ ] Sistema de categorías (campo existe, vista no)
- [ ] Filtros y búsqueda de hábitos (filtro tipo ✅, búsqueda ❌)
- [ ] Templates de hábitos populares
- [x] Estadísticas por hábito (completion rate, top 3, eficacia, días activos)
- [ ] Cloud Function para actualizar stats (se calcula client-side)
- [x] Integración con Dashboard (widget de hábitos con datos reales)
- [ ] Notificaciones push (recordatorios)
- [ ] Responsive design (desktop ok, móvil parcial)
- [x] Animaciones y micro-interactions

### Entregables de Fase 2
1. Módulo de Habit Tracker completo y funcional
2. Sistema de rachas preciso
3. Visualizaciones de progreso (calendario, gráficas)
4. Integración total con Dashboard
5. Performance optimizado (queries eficientes)

---

## Fase 3: Sistema de Tareas (To-Do)

**Objetivo**: Gestión efectiva de tareas pendientes con priorización, fechas de vencimiento, y organización flexible.

### Modelo de Datos

```javascript
// Colección: users/{userId}/tasks/{taskId}
{
  id: string,
  title: string,
  description: string (opcional, markdown),
  priority: 'high' | 'medium' | 'low',
  status: 'pending' | 'completed' | 'cancelled',
  dueDate: timestamp | null,
  createdAt: timestamp,
  completedAt: timestamp | null,
  
  // Organización
  tags: array<string>,
  projectId: string | null, // Link a proyecto de CRM
  goalId: string | null, // Link a objetivo
  
  // Metadata
  estimatedMinutes: number | null,
  isRecurring: boolean,
  recurringPattern: object | null, // {type: 'daily'|'weekly', interval: number}
  
  // Orden
  order: number, // Para custom sorting
  
  // Subtareas
  hasSubtasks: boolean,
  subtasks: array<{
    id: string,
    title: string,
    completed: boolean
  }>
}

// Colección: users/{userId}/task_lists/{listId} (opcional)
{
  id: string,
  name: string,
  color: string,
  icon: string,
  taskIds: array<string>,
  createdAt: timestamp
}
```

### Vistas Principales

#### 1. Vista: Lista de Tareas (Principal)

**Secciones**:

1. **Hoy** (Tareas con dueDate = today o sin fecha pero high priority)
2. **Próximamente** (Tareas con dueDate en los próximos 7 días)
3. **Sin fecha** (Backlog)
4. **Completadas** (últimas 10, colapsable)

**Card de Tarea**:
```
┌────────────────────────────────────────────┐
│ [ ] Terminar diseño de landing page       │
│     🏷️ diseño, cliente-acme                │
│     📅 Hoy a las 16:00 · ⏱️ 2h · 🔴 Alta  │
│     Subtareas: 2/5 completadas             │
└────────────────────────────────────────────┘
```

**Elementos del Card**:
- Checkbox de completitud
- Título (editable inline)
- Tags
- Fecha y hora de vencimiento
- Estimación de tiempo
- Badge de prioridad
- Indicador de proyecto asociado
- Contador de subtareas
- Menu de opciones (3 dots)

**Quick Actions** (swipe o menu):
- ✏️ Editar
- 🗓️ Cambiar fecha
- 🔼 Aumentar prioridad
- 🗑️ Eliminar
- 🔁 Duplicar

#### 2. Vista: Kanban (Opcional)

**Columnas**:
- 📋 To Do
- 🚧 In Progress (status adicional)
- ✅ Done

**Funcionalidad**:
- Drag & drop entre columnas
- Filtros por tag, prioridad, fecha
- Compact/expanded view

#### 3. Modal: Crear/Editar Tarea

**Form fields**:
```javascript
{
  title: string (required),
  description: string (markdown editor),
  priority: 'high' | 'medium' | 'low',
  dueDate: date,
  dueTime: time,
  estimatedMinutes: number,
  tags: array (chip input),
  projectId: dropdown,
  goalId: dropdown,
  subtasks: dynamic list
}
```

**Shortcuts de teclado**:
- `Cmd/Ctrl + Enter` → Guardar
- `Cmd/Ctrl + D` → Duplicar
- `Esc` → Cerrar sin guardar

#### 4. Vista: Calendario de Tareas

**Funcionalidad**:
- Vista mensual con tareas por día
- Color-coded por prioridad
- Click en día → ver tareas de ese día
- Drag para cambiar fecha

#### 5. Vista: Filtros Inteligentes

**Filtros predefinidos**:
- 🔥 Urgentes (high priority + vencen en 24h)
- 📅 Esta semana
- 🎯 Sin fecha asignada
- ⏰ Sobredue (pasadas y no completadas)
- 🏷️ Por tag
- 📁 Por proyecto

**Custom filters**:
- AND/OR conditions
- Guardar filtro como vista
- Compartir filtro (futuro)

### Lógica de Negocio

#### Priorización Automática

```javascript
function calculateTaskPriority(task) {
  let score = 0;
  
  // Base priority
  const priorityScores = { high: 10, medium: 5, low: 1 };
  score += priorityScores[task.priority];
  
  // Due date proximity
  if (task.dueDate) {
    const daysUntilDue = getDaysUntil(task.dueDate);
    if (daysUntilDue <= 0) score += 20; // Overdue
    else if (daysUntilDue === 1) score += 15; // Due tomorrow
    else if (daysUntilDue <= 3) score += 10; // Due this week
    else if (daysUntilDue <= 7) score += 5;
  }
  
  // Project linked (CRM)
  if (task.projectId) score += 3;
  
  // Goal linked
  if (task.goalId) score += 2;
  
  return score;
}

// Auto-sort tasks by calculated priority
function sortTasksByPriority(tasks) {
  return tasks.sort((a, b) => 
    calculateTaskPriority(b) - calculateTaskPriority(a)
  );
}
```

#### Sistema de Subtareas

```javascript
async function toggleSubtask(taskId, subtaskId, userId) {
  const taskRef = doc(db, `users/${userId}/tasks/${taskId}`);
  const task = await getDoc(taskRef);
  
  const updatedSubtasks = task.subtasks.map(st => 
    st.id === subtaskId 
      ? { ...st, completed: !st.completed }
      : st
  );
  
  await updateDoc(taskRef, { subtasks: updatedSubtasks });
  
  // Auto-complete task si todas las subtareas están completas
  const allCompleted = updatedSubtasks.every(st => st.completed);
  if (allCompleted) {
    await completeTask(taskId, userId);
  }
}
```

#### Tareas Recurrentes

```javascript
async function completeRecurringTask(taskId, userId) {
  const task = await getTask(taskId, userId);
  
  if (!task.isRecurring) {
    return completeTask(taskId, userId);
  }
  
  // Marcar como completada
  await updateDoc(taskRef, {
    status: 'completed',
    completedAt: serverTimestamp()
  });
  
  // Crear nueva instancia para próxima recurrencia
  const nextDueDate = calculateNextDueDate(
    task.dueDate, 
    task.recurringPattern
  );
  
  await createTask({
    ...task,
    id: generateId(),
    dueDate: nextDueDate,
    status: 'pending',
    completedAt: null,
    createdAt: serverTimestamp()
  }, userId);
}
```

### Funcionalidades Avanzadas

#### 1. Búsqueda y Quick Add

**Barra de búsqueda**:
- Buscar por título, descripción, tags
- Fuzzy search
- Shortcuts: `/` para enfocar búsqueda

**Quick Add** (desde cualquier vista):
- `Cmd/Ctrl + K` → modal rápido
- Input mínimo: solo título
- Defaults: priority=medium, no dueDate
- Enter para crear, continuar agregando más

#### 2. Bulk Actions

**Selección múltiple**:
- Checkbox en cards
- Acciones en batch:
  - Completar todas
  - Cambiar prioridad
  - Asignar tag
  - Cambiar proyecto
  - Eliminar

#### 3. Templates de Tareas

**Uso**:
- Tareas comunes predefinidas
- Incluyen subtareas
- Ej: "Onboarding cliente nuevo", "Deploy proyecto"
- Crear custom templates

#### 4. Integración con Inbox

**Flujo**:
1. Item en Inbox tipo "task"
2. Botón "Convertir a tarea"
3. Pre-llena título
4. Completa detalles
5. Item se marca como procesado

#### 5. Notificaciones

**Triggers**:
- Tarea vence en 1 hora → notificación
- Tarea overdue → notificación diaria
- Proyecto con tareas críticas → resumen
- Toggle on/off por tarea

### Queries Optimizadas

```javascript
// Tareas de hoy
const todayTasksQuery = query(
  collection(db, `users/${userId}/tasks`),
  where('status', '==', 'pending'),
  where('dueDate', '>=', startOfDay(today)),
  where('dueDate', '<=', endOfDay(today)),
  orderBy('dueDate'),
  orderBy('priority', 'desc')
);

// Tareas overdue
const overdueTasksQuery = query(
  collection(db, `users/${userId}/tasks`),
  where('status', '==', 'pending'),
  where('dueDate', '<', startOfDay(today)),
  orderBy('dueDate', 'asc')
);

// Tareas sin fecha (backlog)
const backlogTasksQuery = query(
  collection(db, `users/${userId}/tasks`),
  where('status', '==', 'pending'),
  where('dueDate', '==', null),
  orderBy('priority', 'desc'),
  orderBy('createdAt', 'desc')
);
```

### Diseño y UX

#### Estados Visuales
```css
.task-high-priority {
  border-left: 4px solid var(--danger);
}

.task-medium-priority {
  border-left: 4px solid var(--warning);
}

.task-low-priority {
  border-left: 4px solid var(--secondary);
}

.task-overdue {
  background: rgba(239, 68, 68, 0.1);
}

.task-completed {
  opacity: 0.6;
  text-decoration: line-through;
}
```

#### Animaciones
- ✅ Slide out al completar tarea
- 🗑️ Fade out al eliminar
- ➕ Slide in al crear nueva
- 🔄 Loader en bulk actions

#### Keyboard Shortcuts
- `N` → Nueva tarea
- `F` → Focus búsqueda
- `1-3` → Cambiar prioridad de tarea seleccionada
- `Espacio` → Toggle completitud
- `E` → Editar tarea seleccionada
- `D` → Delete tarea seleccionada

### Checklist de Completitud - Fase 3

- [x] Modelo de datos implementado
- [x] CRUD de tareas completo
- [x] Vista de lista con secciones (Hoy, Próximamente, Backlog)
- [x] Sistema de priorización (visual y automático)
- [ ] Subtareas funcionales (campo existe en modelo, faltan en UI)
- [ ] Tareas recurrentes
- [x] Modal de crear/editar con todos los campos
- [ ] Búsqueda y filtros
- [ ] Quick add (Cmd+K)
- [ ] Bulk actions
- [ ] Templates de tareas
- [ ] Vista Kanban (opcional)
- [ ] Vista calendario
- [ ] Integración con Inbox
- [x] Integración con Dashboard
- [ ] Notificaciones de vencimiento
- [ ] Keyboard shortcuts
- [x] Responsive design
- [x] Performance optimizado

### Entregables de Fase 3
1. Módulo de Tareas completamente funcional
2. Sistema de priorización automática
3. Múltiples vistas (lista, kanban, calendario)
4. Integración con otros módulos (Inbox, CRM, Goals)
5. UX pulida con shortcuts y quick actions

---

## Fase 4: Inbox (Captura Rápida)

**Objetivo**: Punto de entrada único para capturar ideas, tareas y pensamientos sin fricción, procesarlos después hacia los módulos correctos.

*(Sección pendiente de desarrollo)*

---

## Fase 5: CRM Freelance

**Objetivo**: Gestión de clientes, proyectos, interacciones y estado de trabajos freelance.

*(Sección pendiente de desarrollo)*

---

## Fase 6: Finanzas

**Objetivo**: Seguimiento de ingresos y gastos, principalmente vinculados a proyectos freelance.

*(Sección pendiente de desarrollo)*

---

## Fase 7: Planner (Diario/Semanal)

**Objetivo**: Planificación del día y la semana con top prioridades.

*(Sección pendiente de desarrollo)*

---

## Fase 8: Objetivos (Goals)

**Objetivo**: Definir y hacer seguimiento de metas mensuales y anuales.

*(Sección pendiente de desarrollo)*

---

## Fase 9: Notas e Ideas

**Objetivo**: Captura y organización de notas, con sistema de tags.

*(Sección pendiente de desarrollo)*

---

## Fase 10: Rutinas

**Objetivo**: Agrupar hábitos en bloques ejecutables (rutina de mañana, noche, etc.).

*(Sección pendiente de desarrollo)*

---

## Fase 11: Sistema de Estadísticas

**Objetivo**: Calcular y almacenar métricas precalculadas (mensuales, semanales, anuales) para lectura instantánea.

*(Sección pendiente de desarrollo)*

---

## Fase 12: Optimización y PWA

**Objetivo**: Configurar PWA para instalación en iOS/Android, service workers, y optimización final.

*(Sección pendiente de desarrollo)*

---

## 📝 Notas para el Desarrollo

### Estrategia de Implementación
1. **Incremental**: Completa una fase antes de avanzar a la siguiente
2. **Iterativo**: Cada fase debe quedar funcional y deployable
3. **Testing**: Validar en dispositivos reales (iPhone principalmente)

### Prioridad de Fases
**Críticas** (necesarias para MVP):
- Fase 0, 1, 2, 3, 4

**Importantes** (completan funcionalidad core):
- Fase 5, 6, 7, 8

**Nice-to-have** (agregan valor pero no son críticas):
- Fase 9, 10, 11, 12

### Consideraciones Técnicas
- **Firestore**: Diseñar queries considerando límites de lectura
- **Performance**: Medir tiempo de carga en cada fase
- **Offline**: Considerar Firestore offline persistence desde Fase 0
- **Security**: Actualizar reglas de Firestore en cada fase

### Próximos Pasos
Cuando estés listo para avanzar a la siguiente fase, simplemente indica:
- "Continuar con Fase [N]"
- O solicita más detalles de una fase específica

---

**Última actualización**: 11 Abril 2026
**Versión del documento**: 1.1
**Estado**: Fase 0 (~50%), Fase 1 (~55%), Fase 2 (~65%), Fases 3-12 pendientes (placeholders creados)
