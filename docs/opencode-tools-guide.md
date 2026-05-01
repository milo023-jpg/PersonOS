# OpenCode - Herramientas y Comandos para Analizar Archivos

Guía completa de las herramientas y comandos que tiene disponibles la IA de OpenCode para analizar archivos y proyectos.

---

## Tabla de Contenidos

1. [Herramientas Integradas (Built-in Tools)](#1-herramientas-integradas-built-in-tools)
2. [Comandos Integrados (Built-in Commands)](#2-comandos-integrados-built-in-commands)
3. [Comandos Personalizados (Custom Commands)](#3-comandos-personalizados-custom-commands)
4. [Herramientas Personalizadas (Custom Tools)](#4-herramientas-personalizadas-custom-tools)
5. [Servidores MCP](#5-servidores-mcp)
6. [Permisos](#6-permisos)
7. [Atajos de Teclado Útiles](#7-atajos-de-teclado-útiles)
8. [Modos de Trabajo](#8-modos-de-trabajo)

---

## 1. Herramientas Integradas (Built-in Tools)

Estas son las herramientas que la IA puede usar automáticamente para interactuar con tu código.

### 1.1 `bash` - Ejecutar Comandos de Terminal

Ejecuta comandos de shell en el entorno de tu proyecto.

**Ejemplos de uso:**
- `npm install` - Instalar dependencias
- `git status` - Ver estado del repositorio
- `ls -la` - Listar archivos
- `npm test` - Ejecutar tests

**Configuración:**
```json
{
  "permission": {
    "bash": "allow"  // "allow" | "deny" | "ask"
  }
}
```

---

### 1.2 `read` - Leer Archivos

Lee el contenido de archivos del proyecto. Soporta leer rangos específicos de líneas para archivos grandes.

**Capacidades:**
- Leer archivos completos
- Leer desde una línea específica (offset)
- Leer un número limitado de líneas
- Leer imágenes y PDFs (los retorna como adjuntos)

**Ejemplos de uso:**
- Leer `package.json` para entender dependencias
- Leer un componente específico
- Leer archivos de configuración

**Configuración:**
```json
{
  "permission": {
    "read": "allow"
  }
}
```

---

### 1.3 `edit` - Editar Archivos Existentes

Realiza reemplazos exactos de strings en archivos existentes. Es la forma principal en que la IA modifica código.

**Características:**
- Requiere coincidencia exacta del texto
- Soporte para `replaceAll` para reemplazos múltiples
- Busca el contexto exacto antes de editar
- No agrega comentarios a menos que se solicite

**Configuración:**
```json
{
  "permission": {
    "edit": "allow"
  }
}
```

---

### 1.4 `write` - Crear o Sobrescribir Archivos

Crea nuevos archivos o sobrescribe existentes.

**Usos comunes:**
- Crear nuevos componentes
- Crear archivos de configuración
- Generar documentación

**Nota:** El `write` tool está controlado por el permiso `edit`.

**Configuración:**
```json
{
  "permission": {
    "edit": "allow"
  }
}
```

---

### 1.5 `grep` - Buscar Contenido en Archivos

Búsqueda rápida de contenido en todo el codebase usando expresiones regulares.

**Capacidades:**
- Regex completo (ej. `function\s+\w+`, `import.*from.*react`)
- Filtrar por patrón de archivo (ej. `*.ts`, `*.{ts,tsx}`)
- Retorna rutas de archivos y números de línea
- Ordenado por tiempo de modificación

**Ejemplos de uso:**
- Buscar todas las referencias a una función
- Encontrar imports de una librería
- Buscar patrones específicos en el código

**Ejemplo de patrones:**
```
"export\s+const\s+\w+"     // Buscar constantes exportadas
"interface\s+\w+"          // Buscar interfaces
"useState|useEffect"       // Buscar hooks de React
"TODO|FIXME"              // Buscar comentarios de tareas pendientes
```

**Configuración:**
```json
{
  "permission": {
    "grep": "allow"
  }
}
```

---

### 1.6 `glob` - Buscar Archivos por Patrón

Encuentra archivos usando patrones glob.

**Patrones comunes:**
- `**/*.ts` - Todos los archivos TypeScript
- `src/**/*.tsx` - Todos los componentes React en src/
- `*.json` - Archivos JSON en la raíz
- `**/test/**` - Archivos en directorios de test

**Retorna:** Rutas de archivos ordenadas por tiempo de modificación.

**Configuración:**
```json
{
  "permission": {
    "glob": "allow"
  }
}
```

---

### 1.7 `lsp` (Experimental) - Inteligencia de Código

Interactúa con servidores LSP configurados para obtener características de inteligencia de código.

**Operaciones soportadas:**
- `goToDefinition` - Ir a la definición de un símbolo
- `findReferences` - Encontrar todas las referencias
- `hover` - Obtener información al pasar el cursor
- `documentSymbol` - Símbolos del documento
- `workspaceSymbol` - Símbolos del workspace
- `goToImplementation` - Ir a la implementación
- `prepareCallHierarchy` - Jerarquía de llamadas
- `incomingCalls` - Llamadas entrantes
- `outgoingCalls` - Llamadas salientes

**Requisito:** Necesita `OPENCODE_EXPERIMENTAL_LSP_TOOL=true` o `OPENCODE_EXPERIMENTAL=true`

**Configuración:**
```json
{
  "permission": {
    "lsp": "allow"
  }
}
```

---

### 1.8 `apply_patch` - Aplicar Parches

Aplica archivos patch/diff al codebase.

**Usos:**
- Aplicar diffs de fuentes externas
- Manejar patches generados por otras herramientas
- Los paths están embebidos en líneas marker relativas al root del proyecto

**Nota:** Controlado por el permiso `edit`.

**Configuración:**
```json
{
  "permission": {
    "edit": "allow"
  }
}
```

---

### 1.9 `skill` - Cargar Skills

Carga un skill (archivo `SKILL.md`) y retorna su contenido en la conversación.

**Usos:**
- Cargar instrucciones especializadas
- Activar workflows específicos
- Acceder a recursos de habilidades configuradas

**Configuración:**
```json
{
  "permission": {
    "skill": "allow"
  }
}
```

---

### 1.10 `todowrite` - Gestionar Listas de Tareas

Crea y actualiza listas de tareas para跟踪 el progreso durante operaciones complejas.

**Estados de tareas:**
- `pending` - Tarea no iniciada
- `in_progress` - Trabajando actualmente (solo una a la vez)
- `completed` - Tarea finalizada exitosamente
- `cancelled` - Tarea ya no necesaria

**Usos:**
- Organizar tareas multi-paso
- Tracking de progreso
- Planificación de trabajo complejo

**Nota:** Deshabilitado para subagentes por defecto.

**Configuración:**
```json
{
  "permission": {
    "todowrite": "allow"
  }
}
```

---

### 1.11 `webfetch` - Obtener Contenido Web

Obtiene y lee contenido de páginas web.

**Formatos soportados:**
- `markdown` (por defecto)
- `text`
- `html`

**Usos comunes:**
- Buscar documentación
- Investigar recursos online
- Referenciar especificaciones externas

**Ejemplo:**
```
URL: https://react.dev/reference/react/useState
Formato: markdown
```

**Configuración:**
```json
{
  "permission": {
    "webfetch": "allow"
  }
}
```

---

### 1.12 `websearch` - Búsqueda Web

Realiza búsquedas en internet usando Exa AI.

**Características:**
- Búsqueda en tiempo real
- Hasta 120 segundos de timeout
- Crawl live de sitios web
- Filtrado por dominio
- Diferentes tipos de búsqueda: `auto`, `fast`, `deep`

**Cuándo usar:**
- `websearch` - Para descubrir información
- `webfetch` - Para obtener contenido de una URL específica

**Requisito:** Disponible con el proveedor OpenCode o con `OPENCODE_ENABLE_EXA=true`

**Configuración:**
```json
{
  "permission": {
    "websearch": "allow"
  }
}
```

---

### 1.13 `question` - Hacer Preguntas al Usuario

Permite a la IA hacer preguntas durante la ejecución.

**Usos:**
- Recopilar preferencias del usuario
- Clarificar instrucciones ambiguas
- Obtener decisiones sobre implementación
- Ofrecer opciones de dirección

**Características:**
- Soporte para selección única o múltiple
- Respuestas personalizadas
- Navegación entre múltiples preguntas

**Configuración:**
```json
{
  "permission": {
    "question": "allow"
  }
}
```

---

## 2. Comandos Integrados (Built-in Commands)

Comandos que puedes ejecutar directamente en la TUI de OpenCode.

### 2.1 `/init`

Inicializa OpenCode en el proyecto. Analiza la estructura y crea un archivo `AGENTS.md` en la raíz con información sobre el proyecto.

### 2.2 `/undo`

Deshace los últimos cambios realizados. Puedes ejecutarlo múltiples veces para deshacer varios cambios.

### 2.3 `/redo`

Rehace los cambios que fueron deshechos con `/undo`.

### 2.4 `/share`

Comparte la conversación actual. Crea un link y lo copia al clipboard.

### 2.5 `/help`

Muestra ayuda y información sobre OpenCode.

### 2.6 `/connect`

Conecta con un proveedor de LLM. Permite configurar API keys y autenticación.

---

## 3. Comandos Personalizados (Custom Commands)

Crea comandos reutilizables para tareas repetitivas.

### 3.1 Crear un Comando con Markdown

Crea archivos `.md` en `.opencode/commands/` (por proyecto) o `~/.config/opencode/commands/` (global).

**Ejemplo:** `.opencode/commands/test.md`
```markdown
---
description: Ejecutar tests con coverage
agent: build
model: anthropic/claude-3-5-sonnet-20241022
---

Ejecuta el suite de tests completo con reporte de coverage.
Enfócate en los tests fallidos y sugiere mejoras.
```

**Uso:** `/test`

### 3.2 Crear un Comando con JSON

En `opencode.jsonc`:
```json
{
  "command": {
    "test": {
      "template": "Ejecuta tests con coverage...",
      "description": "Ejecutar tests",
      "agent": "build",
      "model": "anthropic/claude-3-5-sonnet-20241022"
    }
  }
}
```

### 3.3 Argumentos

Usa `$ARGUMENTS` o parámetros posicionales (`$1`, `$2`, `$3`...).

**Ejemplo:** `.opencode/commands/component.md`
```markdown
---
description: Crear nuevo componente
---

Crea un componente React llamado $ARGUMENTS con TypeScript.
```

**Uso:** `/component Button`

### 3.4 Output de Shell

Inyecta output de comandos bash con `!`comando``.

**Ejemplo:** `.opencode/commands/review.md`
```markdown
---
description: Revisar cambios recientes
---

Cambios recientes:
!`git log --oneline -10`

Revisa estos cambios y sugiere mejoras.
```

### 3.5 Referencias a Archivos

Incluye archivos con `@nombre_archivo`.

**Ejemplo:**
```markdown
Revisa el componente @src/components/Button.tsx
```

El contenido se incluye automáticamente en el prompt.

### 3.6 Opciones de Configuración

| Opción | Tipo | Descripción |
|--------|------|-------------|
| `template` | string | **Requerido**. El prompt enviado al LLM |
| `description` | string | Descripción mostrada en la TUI |
| `agent` | string | Agente que ejecuta el comando |
| `subtask` | boolean | Fuerza ejecución como subagente |
| `model` | string | Override del modelo para este comando |

---

## 4. Herramientas Personalizadas (Custom Tools)

Define tus propias funciones que la IA puede llamar.

### 4.1 Configuración Básica

Se definen en el archivo de configuración y pueden ejecutar código arbitrario.

### 4.2 Ejemplo de Uso

```json
{
  "tools": {
    "mi-herramienta": {
      "name": "mi-herramienta",
      "description": "Descripción de lo que hace",
      "parameters": {
        "type": "object",
        "properties": {
          "input": {
            "type": "string",
            "description": "Input del usuario"
          }
        }
      },
      "handler": "node scripts/mi-tool.js"
    }
  }
}
```

---

## 5. Servidores MCP

MCP (Model Context Protocol) permite integrar servicios externos.

### 5.1 Qué es MCP

Protocolo para conectar herramientas y servicios externos como:
- Acceso a bases de datos
- Integraciones con APIs
- Servicios de terceros

### 5.2 Configuración

```json
{
  "mcp": {
    "mi-servidor": {
      "type": "stdio",
      "command": "mi-comando",
      "args": ["--arg1", "--arg2"]
    }
  }
}
```

---

## 6. Permisos

Controla el comportamiento de las herramientas.

### 6.1 Niveles de Permiso

| Permiso | Comportamiento |
|---------|----------------|
| `allow` | La herramienta se ejecuta automáticamente |
| `deny` | La herramienta está bloqueada |
| `ask` | Requiere aprobación del usuario antes de ejecutar |

### 6.2 Ejemplo de Configuración

```json
{
  "permission": {
    "edit": "deny",
    "bash": "ask",
    "webfetch": "allow",
    "mymcp_*": "ask"
  }
}
```

### 6.3 Wildcards

Usa `*` para controlar múltiples herramientas:
```json
{
  "permission": {
    "mymcp_*": "ask"
  }
}
```

---

## 7. Atajos de Teclado Útiles

| Atajo | Acción |
|-------|--------|
| `Tab` | Cambiar entre modo Plan y Build |
| `Ctrl+K` | Buscar archivos fuzzy |
| `/` | Ejecutar comando |
| `@` | Referenciar archivos |

---

## 8. Modos de Trabajo

### 8.1 Modo Plan

- **Deshabilita** la capacidad de hacer cambios
- Sugiere **cómo** implementar una funcionalidad
- Ideal para discutir arquitectura y diseño
- Se activa con `Tab`

### 8.2 Modo Build

- Permite hacer cambios directamente al código
- Usa las herramientas `edit`, `write`, `bash`, etc.
- Se activa con `Tab`

---

## Resumen de Herramientas para Análisis

Para **analizar archivos** específicamente, las herramientas más importantes son:

| Herramienta | Para qué sirve |
|-------------|----------------|
| `read` | Leer contenido de archivos |
| `glob` | Encontrar archivos por patrón |
| `grep` | Buscar contenido con regex |
| `lsp` | Inteligencia de código (definiciones, referencias) |
| `bash` | Ejecutar comandos como `ls`, `find`, etc. |

---

## Notas Internas

- `grep` y `glob` usan [ripgrep](https://github.com/BurntSushi/ripgrep) internamente
- Respetan patrones de `.gitignore` por defecto
- Para incluir archivos normalmente ignorados, crea un `.ignore` en la raíz:
  ```
  !node_modules/
  !dist/
  ```

---

*Documentación basada en la documentación oficial de OpenCode - https://opencode.ai/docs*
