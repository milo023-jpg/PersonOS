# 📊 Arquitectura de Base de Datos - Habit Tracker (Firestore)

## 🎯 Objetivo

Diseñar una base de datos optimizada para:

- Mostrar hábitos diarios con calendario
- Tener estadísticas rápidas (semana, mes)
- Evitar cálculos costosos en tiempo real
- Escalar fácilmente

---

# 🧠 PRINCIPIO CLAVE

❗ NO calcular estadísticas desde logs en tiempo real  
✅ Usar documentos **precalculados** que se actualizan al modificar datos

---

# 🗂️ ESTRUCTURA GENERAL

```
users/{userId}
  profile

  habits/{habitId}
    name
    type (daily | weekly)
    targetPerWeek (nullable)
    createdAt
    isActive

    stats/
      global
        totalCompletions
        currentStreak
        bestStreak
        completionRate

    monthlyStats/{YYYY-MM}
      completedDays
      totalDays
      completionRate

    weeklyStats/{YYYY-WW}
      completedDays
      target
      completionRate

  habitLogs/{logId}
    habitId
    date (YYYY-MM-DD)
    completed (true/false)
```

---

# ⚙️ IMPLEMENTACIÓN ACTUAL (MVP - SOLO HABITS)

## 1. 📌 Colección de hábitos

```
users/{userId}/habits/{habitId}
```

Ejemplo:

```
name: "Leer"
type: "daily"
targetPerWeek: null
createdAt: timestamp
isActive: true
```

---

## 2. 📅 Logs diarios (BASE DEL CALENDARIO)

```
users/{userId}/habitLogs/{habitId_YYYY-MM-DD}
```

Ejemplo ID:

```
reading_2026-04-08
```

Campos:

```
habitId: "reading"
date: "2026-04-08"
completed: true
```

---

## 3. 📊 Estadísticas mensuales (PRECALCULADAS)

```
users/{userId}/habits/{habitId}/monthlyStats/{YYYY-MM}
```

Ejemplo:

```
completedDays: 18
totalDays: 30
completionRate: 0.6
```

---

## 4. 📊 Estadísticas semanales

```
users/{userId}/habits/{habitId}/weeklyStats/{YYYY-WW}
```

Ejemplo:

```
completedDays: 5
target: 7
completionRate: 0.71
```

---

# 🔁 LÓGICA DE ACTUALIZACIÓN (MUY IMPORTANTE)

Cada vez que el usuario marca o desmarca un hábito:

## Se debe hacer:

1. Actualizar `habitLogs`
2. Actualizar `monthlyStats`
3. Actualizar `weeklyStats`
4. (Opcional) Actualizar `stats/global`

---

## ⚡ Regla clave

NO recalcular todo.  
Solo incrementar o decrementar contadores.

---

## 🧮 Ejemplo

Antes:

```
completedDays: 17
```

Después de marcar como completado:

```
completedDays: 18
```

---

# 📅 CALENDARIO DEL HÁBITO

## Query:

```
habitLogs
WHERE habitId == {habitId}
AND date BETWEEN "2026-04-01" AND "2026-04-30"
```

## UI:

- ✅ Verde → completed = true
- ⚪ Gris → no existe o false

---

# ⚡ DASHBOARD RÁPIDO

Para mostrar estadísticas:

## SOLO leer:

```
monthlyStats
weeklyStats
```

❗ NO leer logs

---

# 🧩 RESUMEN

- `habitLogs` → historial (calendario)
- `monthlyStats` → métricas mensuales
- `weeklyStats` → métricas semanales

---

# 🚨 ERRORES A EVITAR

❌ Calcular estadísticas en tiempo real desde logs  
❌ No usar precálculos  
❌ Guardar logs como subcolección dentro de cada hábito  

---

# 🧠 INSTRUCCIÓN PARA IMPLEMENTACIÓN

El sistema debe:

- Actualizar estadísticas automáticamente al modificar logs
- Usar contadores incrementales (no recálculo completo)
- Optimizar lecturas para dashboard
- Permitir carga rápida del calendario mensual
