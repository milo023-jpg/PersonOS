# Módulo de Notas - Person OS

> **Fase 9 del Sistema Operativo Personal**  
> **Estado**: Planificación  
> **Versión**: 1.0  
> **Fecha**: Mayo 2026

---

## 1. Descripción General

El módulo de Notas es el sistema de captura, organización y explotación de conocimiento de Person OS. No es un bloc de notas genérico: es un **segundo cerebro** centrado en **contextos**, donde cada nota vive dentro del flujo real de vida del usuario (trabajo, estudio, salud, proyectos, clientes).

### Diferenciador clave vs Notion/Evernote

| Aspecto | Notion/Evernote | Person OS Notes |
|---------|----------------|-----------------|
| Organización | Carpetas/espacios manuales | **Contextos** + múltiples tags |
| Descubrimiento | Búsqueda manual | **Grafo de relaciones** |
| Acción | Notas estáticas | **Notas → Tareas** con un click |
| Productividad | Herramienta de escritura | **Herramienta de ejecución** integrada al OS |
| Contexto | No existe | **Entidad de primera clase** (ya implementada) |

### Principios de diseño

1. **Captura en <2 segundos**: Si tarda más, el usuario no captura
2. **Contexto primero**: Cada nota sabe a qué pertenece
3. **Conexión sobre colección**: Las notas se relacionan entre sí
4. **Acción sobre almacenamiento**: Cada nota puede generar tareas, recordatorios, eventos

---

## 2. Funcionalidades

### 2.1 Funcionalidades Básicas (MVP)

#### CRUD de Notas
- **Crear**: Modal rápido + vista completa
- **Editar**: Editor enriquecido inline
- **Eliminar**: Soft delete con papelera (30 días retención)
- **Duplicar**: Clonar nota con contenido y estructura

#### Editor Enriquecido (Block-based, tipo Notion simplificado)
Soporte para bloques:
- **Texto**: Párrafos, headings (H1, H2, H3), bold, italic, underline, strikethrough
- **Listas**: Ordenadas y desordenadas
- **Checklists**: Items checkeables con estado persistente
- **Código**: Bloques de código con syntax highlighting (lenguaje seleccionable)
- **Citas**: Blockquotes para destacar información
- **Imágenes**: Inline uploads (Firebase Storage)
- **Archivos adjuntos**: PDFs, docs, etc. (Firebase Storage)
- **Separadores**: Divisores visuales
- **Callouts**: Bloques de atención con icono y color

**Decisión técnica**: Implementar editor propio con `contentEditable` + schema de bloques JSON (no depender de TipTap/Editor.js en MVP para mantener bundle size bajo). Si el equipo crece, migrar a TipTap.

#### Sistema de Tags
- Tags libres (creación on-the-fly)
- Colores asignables por tag
- Búsqueda y filtro por tags
- Búsqueda y filtro por tags

#### Búsqueda
- Búsqueda por texto (título + contenido)
- Filtro por contexto
- Filtro por tag
- Filtro por fecha (creación/actualización)
- Búsqueda en tiempo real (debounce 300ms)

#### Favoritos y Pinned
- **Favoritos**: Estrella para acceso rápido (vista dedicada)
- **Pinned**: Fijar notas al top de la lista (máximo 5 pinned visibles)
- Diferencia: Favoritos = colección especial; Pinned = orden visual

#### Versionado / Historial
- Auto-save cada 3 segundos de inactividad
- Snapshot por cada edición significativa (>10 caracteres cambiados)
- Historial accesible: lista de versiones con fecha
- Restaurar versión anterior
- **Límite**: Últimas 20 versiones por nota (para controlar costos de Firestore)

#### Relación entre Notas (Wiki-linking)
- Sintaxis `[[Nombre de nota]]` en el contenido
- Al escribir `[[`, aparece autocomplete de notas existentes
- Click en link → navega a la nota
- Panel lateral "Notas relacionadas" muestra backlinks
- Las relaciones se almacenan como array de IDs en el modelo

### 2.2 Funcionalidades Avanzadas (Post-MVP)

#### Generación de Tareas desde Notas
- Seleccionar texto → "Convertir a tarea"
- Crea tarea en módulo de Tareas vinculada a la nota
- La nota muestra tareas derivadas en sidebar
- Checkbox en nota que sincroniza con tarea

#### Recordatorios Asociados
- Agregar recordatorio a nota (fecha + hora)
- Notificación push (PWA) cuando vence
- Snooze: 15 min, 1 hora, mañana, personalizado

#### Vista de Grafo
- Visualización tipo Obsidian/Roam Research
- Nodos = notas, edges = relaciones (wiki-links, contexto compartido, tags compartidos)
- Filtros: por contexto, por tag, por fecha
- Click en nodo → abre nota
- **Implementación**: Fuerza-directed graph con canvas (no D3 para reducir bundle)

#### Agrupación Dinámica (Smart Groups)
- Grupos auto-generados basados en reglas:
  - "Notas de esta semana"
  - "Notas sin contexto"
  - "Notas relacionadas con [proyecto X]"
  - "Notas con tareas pendientes"
- Usuario puede crear grupos custom con reglas

#### Plantillas de Notas
- Templates predefinidos:
  - Reunión (agenda, asistentes, action items)
  - Idea (problema, solución, próximos pasos)
  - Research (fuente, hallazgos, conclusiones)
  - Daily log (qué hice, qué aprendí, qué sigue)
  - Project brief (objetivo, alcance, timeline)
- Templates customizables por el usuario
- Variables dinámicas: `{{date}}`, `{{context}}`, `{{user}}`

#### Quick Capture (Captura Rápida)
- **Global shortcut**: `Ctrl/Cmd + Shift + N` desde cualquier vista
- Modal minimal: solo título + contexto
- Enter → crea nota y abre editor completo
- Integrado con el botón "Captura Rápida" del sidebar
- Soporte para clipboard: si hay texto copiado, lo sugiere como contenido

---

## 3. Diseño de Contextos

### 3.1 Modelo de Contexto (extendido del existente)

El módulo de Contextos ya existe en `src/modules/contexts/`. Se extiende con:

```typescript
// src/modules/contexts/domain/models/types.ts (extensión)

export type ContextType = 
  | 'project'      // Proyecto específico
  | 'area'         // Área de vida (Salud, Finanzas, etc.)
  | 'client'       // Cliente freelance
  | 'work'         // Trabajo empleado
  | 'study'        // Estudio/Educación
  | 'personal'     // Personal
  | 'inbox'        // Inbox (sin clasificar)
  | 'other';       // Otro

export interface Context {
  id?: string;
  userId: string;
  name: string;
  type: ContextType;
  color: string;        // Hex color para UI
  icon: string;         // Emoji o lucide icon name
  description?: string; // Descripción del contexto
  
  // Jerarquía
  parentId?: string;    // Contexto padre (null = root)
  order: number;        // Orden de visualización
  
  // Metadata
  isArchived: boolean;
  isDefault: boolean;   // Contextos del sistema (no eliminables)
  notesCount: number;   // Contador denormalizado
  
  createdAt: number;
  updatedAt: number;
}
```

### 3.2 Contextos por Defecto del Sistema

| Contexto | Tipo | Color | Icono | Descripción |
|----------|------|-------|-------|-------------|
| Inbox | inbox | `#94a3b8` | 📥 | Captura sin clasificar |
| Personal | personal | `#8b5cf6` | 🏠 | Vida personal |
| Trabajo | work | `#3b82f6` | 💼 | Trabajo empleado |
| Estudio | study | `#f59e0b` | 📚 | Educación y aprendizaje |
| Salud | area | `#10b981` | 💪 | Salud y bienestar |
| Finanzas | area | `#06b6d4` | 💰 | Finanzas personales |

### 3.3 Asignación de Contextos a Notas

**Múltiples contextos por nota**: Una nota puede pertenecer a N contextos.

```typescript
// En el modelo de Note
contextIds: string[];          // Array de IDs de contexto
primaryContextId: string;      // Contexto principal (para ordenamiento)
```

**Flujo de asignación**:
1. Al crear nota: contexto seleccionado o "Inbox" por defecto
2. Editor: dropdown de contextos en toolbar superior
3. Quick assign: click en badge de contexto → cambia o agrega
4. Bulk assign: seleccionar múltiples notas → asignar contexto

### 3.4 Filtrado por Contexto

**Vista principal**: Sidebar izquierdo con lista de contextos
- Click en contexto → filtra notas de ese contexto
- Badge con contador de notas
- Contexto "Todos" muestra todo
- Contexto "Sin contexto" muestra notas huérfanas

**Query Firestore**:
```typescript
// Notas de un contexto específico
query(
  collection(db, `users/${userId}/notes`),
  where('contextIds', 'array-contains', contextId),
  orderBy('updatedAt', 'desc')
);
```

### 3.5 Vista de Contextos

**Página `/contexts/:id`**: Ya existe, se extiende con:
- Header con info del contexto (nombre, color, icono, descripción)
- Stats: notas totales, notas esta semana, tags más usados
- Lista de notas del contexto
- Sub-contextos (hijos) como tabs o secciones
- Notas recientes del contexto
- Botón "Nueva nota en este contexto"

**Vista global `/contexts`**: Dashboard de todos los contextos
- Grid de cards de contexto
- Cada card muestra: nombre, icono, color, notas count, última nota
- Click → navega a detalle

### 3.6 Jerarquía de Contextos

**Soporte padre-hijo**:
```
Trabajo (padre)
├── Proyecto Alpha (hijo)
├── Cliente ACME (hijo)
└── Administración (hijo)

Personal (padre)
├── Hogar (hijo)
└── Viajes (hijo)
```

**Reglas**:
- Máximo 2 niveles de profundidad (padre → hijo)
- Nota puede tener contexto padre E hijo simultáneamente
- Filtrar por padre incluye notas de hijos (toggle on/off)

---

## 4. UX/UI

### 4.1 Flujo de Creación de Nota

```
[Usuario hace click en "+ Nueva Nota" o Ctrl+Shift+N]
        ↓
[Modal Quick Capture aparece]
  - Campo título (auto-focus)
  - Contexto (dropdown)
  - Preview de contenido si hay clipboard
        ↓
[Usuario escribe título + Enter]
        ↓
[Nota creada → Redirige a editor completo]
  - URL: /notes/:noteId
  - Editor vacío con título pre-llenado
  - Toolbar visible
  - Cursor en primera línea del contenido
```

**Tiempo objetivo**: <2 segundos desde intención a nota creada.

### 4.2 Navegación entre Notas

**Vista principal `/notes`**:
```
┌─────────────────────────────────────────────────────┐
│  Notas                    [🔍 Buscar] [+ Nueva] [⚙] │
├──────────┬──────────────────────────────────────────┤
│ Sidebar  │  Lista de Notas                          │
│          │                                          │
│ 📥 Inbox │  📌 Nota fijada 1                        │
│ (12)     │  📌 Nota fijada 2                        │
│          │  ─────────────────                       │
│ 💼 Trabajo│  Nota reciente 1                         │
│ (45)     │  Nota reciente 2                         │
│          │  Nota reciente 3                         │
│ 📚 Estudio│  ...                                    │
│ (23)     │                                          │
│          │  [Cargar más...]                         │
│ 🏠 Personal│                                         │
│ (18)     │                                          │
│          │                                          │
│ ──────── │                                          │
│ ⭐ Favoritos                                        │
│ 🏷️ Tags                                             │
│ 🗑️ Papelera                                         │
└──────────┴──────────────────────────────────────────┘
```

**Vista de nota individual `/notes/:id`**:
```
┌─────────────────────────────────────────────────────┐
│  ← Todas las Notas    [Contexto ▼] [⭐] [⋮]         │
├─────────────────────────────────────────────────────┤
│                                                     │
│  # Título de la Nota                                │
│                                                     │
│  Contenido editable aquí...                         │
│  Bloques de texto, listas, código, etc.             │
│                                                     │
│  [[Nota relacionada]]                               │
│                                                     │
├─────────────────────────────────────────────────────┤
│ Sidebar derecho (colapsable):                       │
│                                                     │
│  📎 Contextos: Trabajo, Proyecto Alpha              │
│  🏷️ Tags: #reunión, #decisiones                    │
│  🔗 Notas relacionadas (3)                          │
│  ✅ Tareas derivadas (2)                            │
│  📅 Creada: 5 May 2026                              │
│  🕐 Editada: hace 2 horas                           │
│  📜 Historial (8 versiones)                         │
└─────────────────────────────────────────────────────┘
```

### 4.3 Vistas del Módulo

#### Vista Lista (default)
- Lista vertical de notas ordenadas por fecha de actualización
- Cada item muestra: título, preview (primeras 100 chars), contexto(s), tags, fecha
- Hover actions: favorito, eliminar, más opciones
- Scroll infinito (pagination de 30 notas)

#### Vista Tablero (Kanban por contexto)
- Columnas = contextos
- Cards = notas
- Drag & drop para cambiar contexto de nota
- Útil para ver distribución de notas por área

#### Vista Grafo
- Canvas con nodos y conexiones
- Zoom y pan
- Hover en nodo → preview de nota
- Click → abre nota
- Filtros en toolbar superior

#### Vista Favoritos
- Same layout que lista, pero solo notas favoritas
- Orden: pinned primero, luego por fecha

### 4.4 Estados Vacíos

**Sin notas**:
```
┌────────────────────────────────────┐
│                                    │
│           📝                       │
│                                    │
│     Aún no tienes notas            │
│                                    │
│  Comienza capturando una idea,     │
│  una reunión o cualquier           │
│  pensamiento.                      │
│                                    │
│     [+ Crear primera nota]         │
│                                    │
│  💡 Tip: Usa Ctrl+Shift+N para    │
│     captura rápida desde           │
│     cualquier pantalla             │
│                                    │
└────────────────────────────────────┘
```

**Sin resultados de búsqueda**:
```
┌────────────────────────────────────┐
│                                    │
│           🔍                       │
│                                    │
│  No se encontraron notas para      │
│  "término de búsqueda"             │
│                                    │
│  Intenta con otros términos o      │
│  ajusta los filtros.               │
│                                    │
│     [Limpiar filtros]              │
│                                    │
└────────────────────────────────────┘
```

**Contexto sin notas**:
```
┌────────────────────────────────────┐
│                                    │
│           💼                       │
│                                    │
│  No hay notas en "Trabajo"         │
│                                    │
│     [+ Crear nota en Trabajo]      │
│                                    │
└────────────────────────────────────┘
```

### 4.5 Acciones Rápidas

| Acción | Shortcut | Descripción |
|--------|----------|-------------|
| Nueva nota | `Ctrl/Cmd + Shift + N` | Abre quick capture |
| Buscar | `Ctrl/Cmd + K` | Focus en barra de búsqueda |
| Guardar | `Ctrl/Cmd + S` | Force save (auto-save activo) |
| Favorito | `Ctrl/Cmd + D` | Toggle favorito en nota actual |
| Borrar nota | `Ctrl/Cmd + Delete` | Mueve a papelera |
| Deshacer | `Ctrl/Cmd + Z` | Deshacer último cambio |
| Vista grafo | `Ctrl/Cmd + G` | Toggle vista grafo |
| Sidebar toggle | `Ctrl/Cmd + B` | Toggle sidebar derecho |

### 4.6 Atajos de Teclado en Editor

| Shortcut | Acción |
|----------|--------|
| `Ctrl/Cmd + B` | Bold |
| `Ctrl/Cmd + I` | Italic |
| `Ctrl/Cmd + U` | Underline |
| `Ctrl/Cmd + K` | Insert link |
| `Ctrl/Cmd + Shift + X` | Strikethrough |
| `# + Space` | Convertir a H1 |
| `## + Space` | Convertir a H2 |
| `### + Space` | Convertir a H3 |
| `- + Space` | Lista desordenada |
| `1. + Space` | Lista ordenada |
| `[] + Space` | Checklist |
| ` ``` + Enter` | Bloque de código |
| `> + Space` | Blockquote |
| `--- + Enter` | Separador |
| `[[` | Trigger wiki-link autocomplete |

---

## 5. Modelo de Datos

### 5.1 Nota

```typescript
// src/modules/notes/domain/models/Note.ts

export type NoteBlockType = 
  | 'paragraph'
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'bulletList'
  | 'orderedList'
  | 'checklist'
  | 'code'
  | 'quote'
  | 'image'
  | 'file'
  | 'divider'
  | 'callout';

export interface NoteBlock {
  id: string;
  type: NoteBlockType;
  content: string;              // HTML o markdown según tipo
  metadata?: {
    language?: string;          // Para bloques de código
    checked?: boolean;          // Para checklists
    url?: string;               // Para imágenes/archivos
    fileName?: string;          // Para archivos adjuntos
    fileSize?: number;          // En bytes
    icon?: string;              // Para callouts
    color?: string;             // Para callouts
  };
  order: number;                // Orden del bloque en la nota
}

export type NoteType = 'text' | 'checklist' | 'template';

export interface Note {
  id: string;
  userId: string;
  
  // Contenido
  title: string;
  blocks: NoteBlock[];          // Contenido estructurado como bloques
  plainText?: string;           // Denormalizado para búsqueda full-text
  
  // Organización
  contextIds: string[];         // Múltiples contextos
  primaryContextId: string;     // Contexto principal
  tags: string[];               // Tags libres
  
  // Estado
  type: NoteType;
  isFavorite: boolean;
  isPinned: boolean;
  isDeleted: boolean;           // Soft delete
  deletedAt?: number;           // Timestamp de eliminación
  
  // Relaciones
  relatedNoteIds: string[];     // Wiki-links salientes
  backlinkNoteIds: string[];    // Wiki-links entrantes (denormalizado)
  derivedTaskIds: string[];     // IDs de tareas generadas desde esta nota
  
  // Recordatorios
  reminders?: {
    id: string;
    date: number;               // Timestamp
    snoozedUntil?: number;
    completed: boolean;
  }[];
  
  // Template
  templateId?: string;          // Si fue creada desde template
  
  // Metadata
  version: number;              // Versión actual
  wordCount: number;            // Contador de palabras
  
  // Timestamps
  createdAt: number;
  updatedAt: number;
  lastViewedAt?: number;
}
```

### 5.2 Snapshot de Versión

```typescript
// src/modules/notes/domain/models/NoteVersion.ts

export interface NoteVersion {
  id: string;
  noteId: string;
  userId: string;
  
  title: string;
  blocks: NoteBlock[];
  
  version: number;
  createdAt: number;
  
  changeSummary?: string;  // Descripción breve del cambio
}
```

### 5.3 Tag

```typescript
// src/modules/notes/domain/models/Tag.ts

export interface Tag {
  id: string;
  userId: string;
  name: string;             // Sin #, lowercase
  color: string;            // Hex color
  notesCount: number;       // Denormalizado
  createdAt: number;
}
```

### 5.4 Plantilla de Nota

```typescript
// src/modules/notes/domain/models/NoteTemplate.ts

export interface NoteTemplate {
  id: string;
  userId: string;
  
  name: string;
  description?: string;
  icon: string;
  
  blocks: NoteBlock[];      // Bloques predefinidos
  defaultContextId?: string;
  defaultTags: string[];
  
  isSystem: boolean;        // Templates del sistema (no editables)
  isArchived: boolean;
  
  usageCount: number;       // Cuántas veces se ha usado
  createdAt: number;
  updatedAt: number;
}
```

### 5.5 Colecciones Firestore

```
users/{userId}/
  notes/{noteId}/
    id, userId, title, blocks[], plainText,
    contextIds[], primaryContextId, tags[],
    type, isFavorite, isPinned, isDeleted, deletedAt,
    relatedNoteIds[], backlinkNoteIds[], derivedTaskIds[],
    reminders[], templateId, version, wordCount,
    createdAt, updatedAt, lastViewedAt

  note_versions/{versionId}/
    id, noteId, userId, title, blocks[], version, createdAt, changeSummary

  note_tags/{tagId}/
    id, userId, name, color, notesCount, createdAt

  note_templates/{templateId}/
    id, userId, name, description, icon, blocks[],
    defaultContextId, defaultTags[], isSystem, isArchived,
    usageCount, createdAt, updatedAt
```

### 5.6 Índices Compuestos Requeridos

```javascript
// Firestore indexes necesarios

// Notas por contexto, ordenadas por actualización
notes: contextIds (array), updatedAt (desc)

// Notas favoritas, ordenadas por actualización
notes: isFavorite (asc), updatedAt (desc)

// Notas pinned, ordenadas por actualización
notes: isPinned (asc), updatedAt (desc)

// Notas no eliminadas, ordenadas por actualización
notes: isDeleted (asc), updatedAt (desc)

// Notas por tag (requiere array-contains)
notes: tags (array), updatedAt (desc)

// Notas eliminadas (papelera), ordenadas por fecha de eliminación
notes: isDeleted (asc), deletedAt (desc)
```

---

## 6. Arquitectura

### 6.1 Estructura de Carpetas (Clean Architecture)

```
src/modules/notes/
├── domain/
│   ├── models/
│   │   ├── Note.ts
│   │   ├── NoteBlock.ts
│   │   ├── NoteVersion.ts
│   │   ├── Tag.ts
│   │   └── NoteTemplate.ts
│   ├── repositories/
│   │   ├── notes.repository.interface.ts
│   │   ├── versions.repository.interface.ts
│   │   ├── tags.repository.interface.ts
│   │   └── templates.repository.interface.ts
│   └── services/
│       ├── noteLinkParser.service.ts       # Parser de [[wiki-links]]
│       ├── search.service.ts               # Servicio de búsqueda
│       └── noteStats.service.ts            # Estadísticas de notas
│
├── application/
│   ├── useCases/
│   │   ├── createNote.useCase.ts
│   │   ├── updateNote.useCase.ts
│   │   ├── deleteNote.useCase.ts
│   │   ├── getNote.useCase.ts
│   │   ├── listNotes.useCase.ts
│   │   ├── searchNotes.useCase.ts
│   │   ├── toggleFavorite.useCase.ts
│   │   ├── togglePin.useCase.ts
│   │   ├── addContextToNote.useCase.ts
│   │   ├── removeContextFromNote.useCase.ts
│   │   ├── addTagToNote.useCase.ts
│   │   ├── createNoteVersion.useCase.ts
│   │   ├── restoreNoteVersion.useCase.ts
│   │   ├── linkNotes.useCase.ts
│   │   ├── unlinkNotes.useCase.ts
│   │   ├── createTaskFromNote.useCase.ts
│   │   ├── quickCapture.useCase.ts
│   │   └── exportNotes.useCase.ts
│   ├── store/
│   │   └── notesStore.ts                   # Zustand store
│   └── hooks/
│       ├── useNotes.ts
│       ├── useNote.ts
│       ├── useNoteSearch.ts
│       └── useNoteEditor.ts
│
├── infrastructure/
│   ├── repositories/
│   │   ├── notes.repository.ts             # Implementación Firestore
│   │   ├── versions.repository.ts
│   │   ├── tags.repository.ts
│   │   └── templates.repository.ts
│   ├── services/
│   │   └── noteStorage.service.ts          # Firebase Storage para archivos
│   └── mappers/
│       └── note.mapper.ts                  # Firestore doc ↔ Domain model
│
└── presentation/
    ├── pages/
    │   ├── NotesPage.tsx                   # Vista principal
    │   └── NoteEditorPage.tsx              # Editor de nota individual
    ├── components/
    │   ├── NoteList/
    │   │   ├── NoteList.tsx
    │   │   ├── NoteItem.tsx
    │   │   └── NoteListSkeleton.tsx
    │   ├── NoteEditor/
    │   │   ├── NoteEditor.tsx
    │   │   ├── BlockRenderer.tsx
    │   │   ├── BlockTypes/
    │   │   │   ├── ParagraphBlock.tsx
    │   │   │   ├── HeadingBlock.tsx
    │   │   │   ├── ChecklistBlock.tsx
    │   │   │   ├── CodeBlock.tsx
    │   │   │   ├── ImageBlock.tsx
    │   │   │   ├── FileBlock.tsx
    │   │   │   ├── QuoteBlock.tsx
    │   │   │   ├── CalloutBlock.tsx
    │   │   │   └── DividerBlock.tsx
    │   │   ├── EditorToolbar.tsx
    │   │   ├── WikiLinkAutocomplete.tsx
    │   │   └── EditorStatusBar.tsx
    │   ├── NoteSidebar/
    │   │   ├── NoteSidebar.tsx
    │   │   ├── ContextSelector.tsx
    │   │   ├── TagManager.tsx
    │   │   ├── RelatedNotes.tsx
    │   │   ├── DerivedTasks.tsx
    │   │   └── VersionHistory.tsx
    │   ├── NoteGraph/
    │   │   ├── NoteGraph.tsx
    │   │   └── GraphNode.tsx
    │   ├── QuickCapture/
    │   │   ├── QuickCaptureModal.tsx
    │   │   └── QuickCaptureButton.tsx
    │   ├── Search/
    │   │   ├── NoteSearchBar.tsx
    │   │   └── SearchResults.tsx
    │   ├── Templates/
    │   │   ├── TemplatePicker.tsx
    │   │   └── TemplateCard.tsx
    │   └── Shared/
    │       ├── ContextBadge.tsx
    │       ├── TagChip.tsx
    │       └── EmptyState.tsx
    └── mobile/
        ├── NotesHome.mobile.tsx
        └── NoteEditor.mobile.tsx
```

### 6.2 Capas y Responsabilidades

#### Domain Layer
- **Models**: Interfaces TypeScript puras, sin dependencias externas
- **Repositories (interfaces)**: Contratos abstractos para acceso a datos
- **Services**: Lógica de negocio pura (parsing de links, búsqueda)

#### Application Layer
- **Use Cases**: Casos de uso individuales, cada uno con una responsabilidad
- **Store**: Zustand store que orquesta use cases y mantiene estado UI
- **Hooks**: React hooks para consumo en componentes

#### Infrastructure Layer
- **Repositories (implementación)**: Implementación Firestore de los contratos
- **Services**: Integración con Firebase Storage
- **Mappers**: Transformación entre documentos Firestore y modelos de dominio

#### Presentation Layer
- **Pages**: Vistas de página completa
- **Components**: Componentes reutilizables organizados por feature
- **Mobile**: Variantes específicas para móvil

### 6.3 Casos de Uso Principales

```typescript
// Ejemplo: CreateNoteUseCase

interface CreateNoteInput {
  userId: string;
  title: string;
  blocks?: NoteBlock[];
  contextIds?: string[];
  primaryContextId?: string;
  tags?: string[];
  type?: NoteType;
  templateId?: string;
}

interface CreateNoteOutput {
  noteId: string;
  note: Note;
}

  async execute(input: CreateNoteInput): Promise<CreateNoteOutput> {
    // 1. Asignar contexto (Inbox por defecto)
    let contextIds = input.contextIds ?? ['inbox'];

    // 2. Crear tags que no existan
    if (input.tags) {
      for (const tagName of input.tags) {
        await this.tagsRepository.ensureExists(input.userId, tagName);
      }
    }

    // 3. Construir nota
    const now = Date.now();
    const note: Omit<Note, 'id'> = {
      userId: input.userId,
      title: input.title,
      blocks: input.blocks ?? [],
      plainText: this.extractPlainText(input.blocks ?? []),
      contextIds,
      primaryContextId: input.primaryContextId ?? contextIds[0],
      tags: input.tags ?? [],
      type: input.type ?? 'text',
      isFavorite: false,
      isPinned: false,
      isDeleted: false,
      relatedNoteIds: [],
      backlinkNoteIds: [],
      derivedTaskIds: [],
      version: 1,
      wordCount: this.countWords(input.blocks ?? []),
      createdAt: now,
      updatedAt: now,
    };

    // 4. Persistir
    const noteId = await this.notesRepository.create(note);

    return {
      noteId,
      note: { id: noteId, ...note },
    };
  }

  private extractPlainText(blocks: NoteBlock[]): string {
    return blocks
      .map(b => b.content.replace(/<[^>]*>/g, ''))
      .join('\n');
  }

  private countWords(blocks: NoteBlock[]): number {
    const text = this.extractPlainText(blocks);
    return text.split(/\s+/).filter(w => w.length > 0).length;
  }
}
```

### 6.4 Repositorios

```typescript
// Interface
interface NotesRepository {
  create(note: Omit<Note, 'id'>): Promise<string>;
  getById(userId: string, noteId: string): Promise<Note | null>;
  update(userId: string, noteId: string, partial: Partial<Note>): Promise<void>;
  delete(userId: string, noteId: string): Promise<void>;
  permanentDelete(userId: string, noteId: string): Promise<void>;
  
  listByContext(userId: string, contextId: string, limit?: number): Promise<Note[]>;
  listFavorites(userId: string, limit?: number): Promise<Note[]>;
  listPinned(userId: string): Promise<Note[]>;
  listDeleted(userId: string): Promise<Note[]>;
  listRecent(userId: string, limit?: number): Promise<Note[]>;
  listByTag(userId: string, tag: string, limit?: number): Promise<Note[]>;
  
  search(userId: string, query: string, filters?: SearchFilters): Promise<Note[]>;
  
  incrementVersion(userId: string, noteId: string): Promise<void>;
  updateBacklinks(userId: string, noteId: string, backlinks: string[]): Promise<void>;
}

// Implementación Firestore
class FirestoreNotesRepository implements NotesRepository {
  constructor(private dbService: DbService) {}

  async create(note: Omit<Note, 'id'>): Promise<string> {
    return this.dbService.addDocument(`users/${note.userId}/notes`, note);
  }

  async getById(userId: string, noteId: string): Promise<Note | null> {
    return this.dbService.getDocument<Note>(`users/${userId}/notes`, noteId);
  }

  async update(userId: string, noteId: string, partial: Partial<Note>): Promise<void> {
    await this.dbService.updateDocument(
      `users/${userId}/notes`, 
      noteId, 
      { ...partial, updatedAt: Date.now() }
    );
  }

  async listByContext(userId: string, contextId: string, limit = 50): Promise<Note[]> {
    const constraints = [
      where('contextIds', 'array-contains', contextId),
      where('isDeleted', '==', false),
      orderBy('updatedAt', 'desc'),
      limit(limit),
    ];
    return this.dbService.queryMultiple<Note>(
      `users/${userId}/notes`, 
      constraints
    );
  }

  async search(userId: string, query: string, filters?: SearchFilters): Promise<Note[]> {
    // MVP: búsqueda client-side sobre notas recientes
    const recentNotes = await this.listRecent(userId, 500);
    
    const lowerQuery = query.toLowerCase();
    let results = recentNotes.filter(note =>
      note.title.toLowerCase().includes(lowerQuery) ||
      (note.plainText?.toLowerCase().includes(lowerQuery) ?? false)
    );

    // Aplicar filtros
    if (filters?.contextId) {
      results = results.filter(n => n.contextIds.includes(filters.contextId!));
    }
    if (filters?.tag) {
      results = results.filter(n => n.tags.includes(filters.tag!));
    }
    if (filters?.favorite) {
      results = results.filter(n => n.isFavorite);
    }

    return results;
  }
}
```

### 6.5 Zustand Store

```typescript
// src/modules/notes/application/store/notesStore.ts

interface NotesState {
  // Data
  notes: Note[];
  currentNote: Note | null;
  tags: Tag[];
  templates: NoteTemplate[];
  
  // UI State
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  searchResults: Note[];
  selectedContextId: string | null;
  selectedTag: string | null;
  viewMode: 'list' | 'board' | 'graph';
  sidebarOpen: boolean;
  
  // Actions
  fetchNotes: (userId: string) => Promise<void>;
  fetchNote: (userId: string, noteId: string) => Promise<void>;
  createNote: (userId: string, input: CreateNoteInput) => Promise<string>;
  updateNote: (userId: string, noteId: string, partial: Partial<Note>) => Promise<void>;
  deleteNote: (userId: string, noteId: string) => Promise<void>;
  restoreNote: (userId: string, noteId: string) => Promise<void>;
  
  toggleFavorite: (userId: string, noteId: string) => Promise<void>;
  togglePin: (userId: string, noteId: string) => Promise<void>;
  
  addContext: (userId: string, noteId: string, contextId: string) => Promise<void>;
  removeContext: (userId: string, noteId: string, contextId: string) => Promise<void>;
  
  addTag: (userId: string, noteId: string, tag: string) => Promise<void>;
  removeTag: (userId: string, noteId: string, tag: string) => Promise<void>;
  
  search: (userId: string, query: string, filters?: SearchFilters) => Promise<void>;
  
  setCurrentNote: (note: Note | null) => void;
  setSelectedContext: (contextId: string | null) => void;
  setViewMode: (mode: 'list' | 'board' | 'graph') => void;
  toggleSidebar: () => void;
  
  quickCapture: (userId: string, title: string, contextId?: string) => Promise<string>;
}
```

### 6.6 Integración con Firebase

#### Firestore
- Colecciones sub-ruta `users/{userId}/` para aislamiento por usuario
- Offline persistence habilitado (`enableIndexedDbPersistence`)
- Real-time listeners para notas abiertas (`onSnapshot`)

#### Firebase Storage
- Carpeta: `users/{userId}/notes/attachments/`
- Archivos nombrados: `{noteId}/{blockId}/{fileName}`
- Metadata: contentType, size, createdAt
- Cleanup automático al eliminar nota (Cloud Function)

### 6.7 Sincronización en Tiempo Real

**Estrategia**: Optimistic updates + Firestore listeners

```typescript
// Patrón de actualización optimista
async updateNote(userId, noteId, partial) {
  // 1. Guardar estado anterior para rollback
  const previousNote = get().currentNote;
  
  // 2. Update optimista inmediato
  set(state => ({
    currentNote: state.currentNote 
      ? { ...state.currentNote, ...partial, updatedAt: Date.now() }
      : null,
    notes: state.notes.map(n => 
      n.id === noteId 
        ? { ...n, ...partial, updatedAt: Date.now() }
        : n
    )
  }));
  
  // 3. Persistir en Firestore
  try {
    await notesRepository.update(userId, noteId, partial);
  } catch (error) {
    // 4. Rollback si falla
    set({ currentNote: previousNote, error: 'No se pudo guardar' });
  }
}
```

### 6.8 Manejo Offline-First

```typescript
// Habilitar offline persistence en Firebase init
import { enableIndexedDbPersistence } from 'firebase/firestore';

enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    // Múltiples tabs abiertos
  } else if (err.code === 'unimplemented') {
    // Browser no soporta
  }
});
```

---

## 7. Escalabilidad y Futuro

### 7.1 Performance a Escala

#### Problema: Miles de notas → queries lentas

**Soluciones**:

1. **Paginación cursor-based** (no offset):
```typescript
// En lugar de limit/offset, usar último documento
const firstPage = await getDocs(
  query(collection, orderBy('updatedAt', 'desc'), limit(30))
);
const lastVisible = firstPage.docs[firstPage.docs.length - 1];
const secondPage = await getDocs(
  query(collection, orderBy('updatedAt', 'desc'), 
        startAfter(lastVisible), limit(30))
);
```

2. **Índices denormalizados**:
   - `plainText` field para búsqueda sin parsear bloques
   - `wordCount` pre-calculado
   - `notesCount` en contextos y tags

3. **Lazy loading de bloques pesados**:
   - Imágenes: lazy load con placeholder
   - Archivos: solo metadata, download on demand

### 7.2 Indexación

**Índices Firestore requeridos**:

| Colección | Campos | Tipo |
|-----------|--------|------|
| notes | contextIds (array), updatedAt (desc) | Compuesto |
| notes | tags (array), updatedAt (desc) | Compuesto |
| notes | isFavorite, updatedAt (desc) | Compuesto |
| notes | isDeleted, deletedAt (desc) | Compuesto |
| notes | isPinned, updatedAt (desc) | Compuesto |
| note_versions | noteId, createdAt (desc) | Compuesto |

### 7.4 Exportación/Importación

**Exportar**:
- **Markdown**: Cada nota como archivo `.md`
- **PDF**: Nota individual como PDF
- **ZIP**: Todas las notas en estructura de carpetas por contexto
- **JSON**: Backup completo con metadata

**Importar**:
- **Markdown**: Parsear archivos `.md` → bloques
- **Evernote**: Importar `.enex` files
- **Notion**: Importar export de Notion (HTML/Markdown)
- **CSV**: Notas simples desde spreadsheet

---

## 8. Ideas Innovadoras (Diferenciadores)

### 8.1 Notas Vivas (Living Notes)

Las notas no son estáticas: evolucionan con el contexto del usuario.

- **Nota de reunión**: Se actualiza automáticamente cuando hay tareas derivadas completadas
- **Nota de proyecto**: Muestra progreso real del proyecto (integración con módulo CRM/Tareas)
- **Nota de idea**: Se "reactiva" cuando hay notas relacionadas nuevas

### 8.2 Contexto Temporal

Las notas se agrupan automáticamente por "momentos":
- "Esta mañana" (notas creadas 6am-12pm)
- "Reunión de las 3pm" (notas del rango 15:00-16:00)
- "Sesión de estudio" (notas agrupadas por proximity temporal)

### 8.3 Nota del Día

Cada día, el sistema genera automáticamente una "Nota del Día":
- Template de daily log pre-llenado
- Incluye: tareas del día, hábitos pendientes, reuniones del planner
- Se archiva al día siguiente como referencia

### 8.4 Score de Utilidad

Cada nota tiene un "utility score" calculado por:
- Frecuencia de acceso (+1 por vista)
- Número de backlinks (+3 por link)
- Tareas derivadas completadas (+5 por tarea)
- Antigüedad (-1 por mes sin acceso)

Notas con score bajo se sugieren para archivar. Notas con score alto se destacan.

### 8.5 Modo Enfoque

- Pantalla completa sin distracciones
- Solo la nota actual, sin sidebar, sin toolbar
- Tipografía optimizada para lectura
- Timer Pomodoro integrado
- Al terminar, pregunta: "¿Quieres agregar algo más a esta nota?"

### 8.6 Cross-Module Intelligence

Integración profunda con otros módulos de Person OS:

| Módulo | Integración |
|--------|-------------|
| Tareas | Notas → Tareas con un click. Tareas muestran notas de referencia. |
| Contextos | Notas filtradas por contexto. Contextos muestran notas recientes. |
| Planner | Notas del día auto-generadas. Bloques de planner linkean a notas. |
| CRM | Notas de reuniones de cliente auto-asociadas al proyecto. |
| Goals | Notas de progreso vinculadas a objetivos. |
| Habits | Notas de reflexión sobre hábitos (¿por qué fallé hoy?). |
| Inbox | Items de inbox convertibles a notas. |
| Finance | Notas de decisiones financieras vinculadas a registros. |

---

## 9. Plan de Implementación (Sprints)

### Sprint 1: Foundation (Semana 1-2)
- [ ] Modelos de dominio (Note, NoteBlock, Tag, NoteTemplate)
- [ ] Interfaces de repositorio
- [ ] Repositorio Firestore (CRUD básico)
- [ ] Zustand store básico
- [ ] Vista principal (lista vacía con estados)
- [ ] Crear nota básica (título + contenido plain text)

### Sprint 2: Editor (Semana 3-4)
- [ ] Editor de bloques (paragraph, heading, list)
- [ ] Toolbar de formato
- [ ] Auto-save (debounce 3s)
- [ ] Vista de nota individual
- [ ] Atajos de teclado básicos
- [ ] Integración con contextos existentes

### Sprint 3: Organización (Semana 5-6)
- [ ] Sistema de tags (crear, asignar, filtrar)
- [ ] Múltiples contextos por nota
- [ ] Favoritos y pinned
- [ ] Búsqueda básica (texto + filtros)
- [ ] Sidebar de nota (contextos, tags, metadata)
- [ ] Wiki-links ([[nota]])

### Sprint 4: Advanced Features (Semana 7-8)
- [ ] Versionado / historial
- [ ] Checklist blocks
- [ ] Code blocks
- [ ] Image/file upload (Firebase Storage)
- [ ] Quick capture (modal global)
- [ ] Plantillas de notas
- [ ] Papelera (soft delete + restore)

### Sprint 5: Polish + Integration (Semana 9-10)
- [ ] Vista de grafo
- [ ] Integración con módulo de Tareas
- [ ] Recordatorios
- [ ] Exportación (Markdown, JSON)
- [ ] Responsive mobile
- [ ] Offline-first
- [ ] Performance optimization

### Sprint 6: Future & Advanced Polish (Semana 11-12)
- [ ] Nota del día
- [ ] Utility score
- [ ] Modo enfoque

---

## 10. Métricas de Éxito

| Métrica | Target MVP | Target V1 |
|---------|-----------|-----------|
| Tiempo para crear nota | <2s | <1.5s |
| Tiempo para encontrar nota | <3s | <1s |
| Notas creadas por usuario/semana | 5+ | 15+ |
| % notas con contexto asignado | 60% | 90% |
| % notas con al menos 1 tag | 30% | 70% |
| % notas con wiki-links | 10% | 40% |
| Satisfacción del usuario (NPS) | 40+ | 60+ |

---

## 11. Riesgos y Mitigación

| Riesgo | Impacto | Probabilidad | Mitigación |
|--------|---------|--------------|------------|
| Firestore costos con muchas lecturas | Alto | Media | Cache en Zustand, paginación, queries optimizadas |
| Editor custom muy complejo | Alto | Alta | MVP con plain text, iterar a bloques gradualmente |
| Bundle size crece demasiado | Medio | Media | Lazy loading de componentes, code splitting |
| Offline sync conflicts | Medio | Baja | Last-write-wins MVP, CRDTs en futuro |

---

## 12. Decisiones Técnicas Clave

### ¿Por qué editor propio y no TipTap/Editor.js?

**MVP**: Editor propio con schema JSON simple.
- Razón: Control total del bundle size, sin dependencias pesadas
- Trade-off: Más trabajo inicial, menos features out-of-the-box

**Post-MVP**: Evaluar migración a TipTap si:
- El equipo crece
- Se necesitan features complejas (collaborative editing, tablas)
- El mantenimiento del editor custom se vuelve costoso

### ¿Por qué Zustand y no React Query?

El proyecto ya usa Zustand como patrón. Para MVP:
- Consistencia con el resto del proyecto
- Simplicidad: un solo store por módulo
- Offline: Zustand + Firestore offline persistence es suficiente

**Post-MVP**: Evaluar React Query si:
- Se necesitan features avanzadas de cache
- Se implementa búsqueda externa (Algolia)
- El equipo necesita patrones más estandarizados

### ¿Por qué bloques JSON y no HTML/Markdown?

- **JSON**: Estructurado, validable, fácil de migrar, soporte para metadata por bloque
- **HTML**: Frágil, difícil de parsear, mezcla contenido con presentación
- **Markdown**: Bueno para export, limitado para bloques complejos (imágenes con metadata, checklists con estado)

El `plainText` denormalizado se usa solo para búsqueda.

---

> **Nota**: Este documento es un plan vivo. Se actualizará conforme se tomen decisiones durante la implementación y se descubran nuevos requerimientos.
