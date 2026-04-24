import { db } from '../services/firebase';
import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import { GENERAL_LIST_ID } from '../modules/tasks/domain/constants/defaults';
import type { Subtask, Task } from '../modules/tasks/domain/models/Task';

/**
 * Script de Seed para repoblar la base de datos de tareas.
 * Borra las tareas existentes pero RESPETA las listas del usuario.
 * Distribuye nuevas tareas de prueba entre las listas actuales.
 */
export async function seedDBWithLists(userId: string) {
    if (!userId) return;

    console.log("Reiniciando tareas para el usuario:", userId);

    // 1. Obtener las listas existentes para saber a dónde asignar tareas
    const listsRef = collection(db, `users/${userId}/taskLists`);
    const listsSnapshot = await getDocs(listsRef);
    let listIds = listsSnapshot.docs.map(d => d.id);

    // Fallback si no hay listas (aunque siempre debería haber una por defecto)
    if (listIds.length === 0) {
        listIds = [GENERAL_LIST_ID];
    }

    // 2. Borrar tareas actuales
    const tasksRef = collection(db, `users/${userId}/tasks`);
    const tasksSnapshot = await getDocs(tasksRef);
    const batchDeleteTasks = writeBatch(db);
    tasksSnapshot.forEach(d => batchDeleteTasks.delete(d.ref));
    await batchDeleteTasks.commit();
    console.log("✓ Tareas antiguas eliminadas. Listas respetadas:", listIds.length);

    // 3. Crear tareas nuevas (alrededor de la fecha actual)
    const now = new Date();
    const baseDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12).getTime();
    const dayMillis = 24 * 60 * 60 * 1000;
    const taskBatch = writeBatch(db);

    const taskTitles = [
        "Finalizar módulo de subtareas",
        "Comprar suministros semanales",
        "Subir cambios a producción",
        "Revisar pendientes del backlog",
        "Entrenamiento de hoy 🏋️",
        "Lavar el coche",
        "Pagar servicios públicos",
        "Llamar al médico",
        "Organizar archivos del proyecto",
        "Comprar regalo de aniversario",
        "Estudiar patrones de arquitectura",
        "Preparar cena premium",
        "Actualizar documentación",
        "Reunión de sincronización",
        "Limpiar el escritorio",
    ];

    for (let i = 0; i < taskTitles.length; i++) {
        // Distribución de fechas
        const dateRoll = Math.random();
        let dueDate: number | undefined;
        if (dateRoll < 0.4) dueDate = baseDate; // Hoy
        else if (dateRoll < 0.7) dueDate = baseDate + dayMillis; // Mañana
        else if (dateRoll < 0.9) dueDate = baseDate - dayMillis; // Ayer
        
        const isCompleted = Math.random() < 0.2;
        const randomListId = listIds[Math.floor(Math.random() * listIds.length)];
        
        // Crear subtareas realistas
        const subtasks: Subtask[] = [];
        if (i % 3 === 0) {
            const subCount = 3 + Math.floor(Math.random() * 3);
            for (let j = 1; j <= subCount; j++) {
                subtasks.push({
                    id: crypto.randomUUID(),
                    title: `Sub-item ${j} de ${taskTitles[i].toLowerCase()}`,
                    completed: j === 1 && !isCompleted,
                    createdAt: Date.now() - (j * 1000)
                });
            }
        }

        const t: Omit<Task, 'id'> = {
            userId,
            title: taskTitles[i],
            description: "Generada automáticamente por el seed respetando tus listas.",
            status: isCompleted ? "completed" : "todo",
            priority: ["low", "medium", "high", "urgent"][Math.floor(Math.random() * 4)] as any,
            dueDate,
            createdAt: Date.now() - (Math.random() * 5 * dayMillis),
            updatedAt: Date.now(),
            listId: randomListId,
            isRecurring: false,
            order: i,
            source: 'manual',
            subtasks
        };

        if (isCompleted) {
            (t as any).completedAt = Date.now();
            t.subtasks?.forEach(s => s.completed = true);
        }

        const tRef = doc(tasksRef);
        taskBatch.set(tRef, { ...t, id: tRef.id });
    }
    
    await taskBatch.commit();
    console.log("✓ Seed de tareas (en listas existentes) completado.");
}
