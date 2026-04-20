import { db } from '../services/firebase';
import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';

export async function seedDBWithLists(userId: string) {
    if (!userId) return;

    // 1. Borrar tareas actuales
    const tasksRef = collection(db, `users/${userId}/tasks`);
    const tasksSnapshot = await getDocs(tasksRef);
    const batchDeleteTasks = writeBatch(db);
    tasksSnapshot.forEach(d => batchDeleteTasks.delete(d.ref));
    await batchDeleteTasks.commit();

    // 2. Borrar listas actuales
    const listsRef = collection(db, `users/${userId}/taskLists`);
    const listsSnapshot = await getDocs(listsRef);
    const batchDeleteLists = writeBatch(db);
    listsSnapshot.forEach(d => batchDeleteLists.delete(d.ref));
    await batchDeleteLists.commit();

    // 3. Crear nuevas listas semillas
    const predefinedLists = [
        { name: '🛠️ Proyecto Personal OS', color: 'bg-primary' },
        { name: '🛒 Compras de la casa', color: 'bg-emerald-500' },
        { name: '📚 Universidad / Cursos', color: 'bg-blue-500' },
    ];

    const listsBatch = writeBatch(db);
    const listIds: string[] = [];

    predefinedLists.forEach((list, index) => {
        const lRef = doc(listsRef);
        listIds.push(lRef.id);
        listsBatch.set(lRef, {
            ...list,
            id: lRef.id,
            userId,
            order: index,
            createdAt: Date.now()
        });
    });
    await listsBatch.commit();

    // 4. Crear tareas y asignarlas a las listas (Entre 17 y 22 de abril)
    const baseDate = new Date("2026-04-17T12:00:00.000Z").getTime();
    const dayMillis = 24 * 60 * 60 * 1000;
    const taskBatch = writeBatch(db);

    for (let i = 1; i <= 15; i++) {
        // Random offset entre 0 y 5 días (17 + 5 = 22 de abril)
        const offsetDays = Math.floor(Math.random() * 6);
        const isCompleted = i <= 3;
        const dueDate = baseDate + (offsetDays * dayMillis);
        const randomListId = listIds[i % listIds.length];
        
        const t = {
            userId,
            title: `[Seed] Tarea ${i} (Abril ${17 + offsetDays})`,
            description: "Generada automáticamente desde el seed.",
            status: isCompleted ? "completed" : "todo",
            priority: ["low", "medium", "high", "urgent"][Math.floor(Math.random() * 4)],
            dueDate,
            createdAt: baseDate - (10 * dayMillis),
            updatedAt: baseDate,
            listId: randomListId, // Asignada a una lista!!
            isRecurring: false,
            order: i,
            isImportant: i % 3 === 0,
            isInbox: false
        } as any;

        if (isCompleted) t.completedAt = baseDate - dayMillis;

        const tRef = doc(tasksRef);
        taskBatch.set(tRef, { ...t, id: tRef.id });
    }
    
    // Tareas adicionales sin lista (para el Inbox)
    for (let i = 16; i <= 18; i++) {
        const t = {
            userId,
            title: `[Seed] Idea rápida ${i} en Inbox`,
            status: "todo",
            priority: "low",
            createdAt: baseDate,
            updatedAt: baseDate,
            isRecurring: false,
            order: i,
            isImportant: false,
            isInbox: true
        } as any;
        const tRef = doc(tasksRef);
        taskBatch.set(tRef, { ...t, id: tRef.id });
    }

    await taskBatch.commit();
    console.log("¡Seed de Listas y Tareas completado exitosamente!");
}
