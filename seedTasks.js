import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, writeBatch } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyC6mYGrDCSNCZ0QO1DsBspI6gCuly1QlRQ",
    authDomain: "personal-os-1b5a5.firebaseapp.com",
    projectId: "personal-os-1b5a5",
    storageBucket: "personal-os-1b5a5.firebasestorage.app",
    messagingSenderId: "552561771760",
    appId: "1:552561771760:web:c8d5e78b618ff5874eee35"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const userId = "dev-user-001";

const tasksRef = collection(db, `users/${userId}/tasks`);
const listsRef = collection(db, `users/${userId}/taskLists`);

const taskTitles = [
    "Definir arquitectura base del proyecto",
    "Revisar widgets del dashboard",
    "Preparar backlog de mejoras UX",
    "Limpiar componentes legacy",
    "Optimizar carga inicial",
    "Actualizar documentación técnica",
    "Diseñar flujo de captura rápida",
    "Corregir estados vacíos en tareas",
    "Agregar feedback visual en formularios",
    "Revisar performance del tablero",
    "Separar lógica de listas por store",
    "Validar persistencia en Firebase",
    "Refinar navegación móvil",
    "Crear checklist de despliegue",
    "Probar edición de tareas complejas",
    "Ajustar estilos de lista General",
    "Depurar filtros de Today",
    "Normalizar datos existentes",
    "Revisar seeds de desarrollo",
    "Preparar demo para pruebas internas",
    "Documentar decisiones de producto",
    "Ordenar prioridades semanales",
    "Corregir scroll en vistas largas",
    "Afinar copy del módulo Inbox"
];

async function seed() {
    console.log("Fetching existing lists...");
    const listsSnapshot = await getDocs(listsRef);
    const lists = listsSnapshot.docs.map((listDoc) => ({
        id: listDoc.id,
        ...listDoc.data()
    }));

    if (lists.length === 0) {
        throw new Error("No existen listas para asignar tareas. Crea al menos una lista antes de correr el seed.");
    }

    console.log(`Found ${lists.length} lists. Cleaning existing tasks...`);
    const existingTasks = await getDocs(tasksRef);
    const deleteBatch = writeBatch(db);
    let deletedCount = 0;

    existingTasks.forEach((taskDoc) => {
        deleteBatch.delete(taskDoc.ref);
        deletedCount++;
    });

    if (deletedCount > 0) {
        await deleteBatch.commit();
        console.log(`Deleted ${deletedCount} old tasks.`);
    }

    const baseDate = new Date("2026-04-21T12:00:00.000Z").getTime();
    const dayMillis = 24 * 60 * 60 * 1000;
    const priorities = ["low", "medium", "high", "urgent"];
    const statuses = ["todo", "todo", "todo", "in_progress", "completed"];
    const tasksToCreate = 24;

    const insertBatch = writeBatch(db);

    for (let i = 0; i < tasksToCreate; i++) {
        const list = lists[i % lists.length];
        const status = statuses[i % statuses.length];
        const priority = priorities[i % priorities.length];
        const offsetDays = (i % 9) - 3;
        const createdAt = baseDate - ((10 - (i % 6)) * dayMillis);
        const dueDate = baseDate + (offsetDays * dayMillis);
        const completedAt = status === "completed" ? dueDate + 2 * 60 * 60 * 1000 : undefined;

        const task = {
            userId,
            title: `[Seed] ${taskTitles[i % taskTitles.length]}`,
            description: `Tarea semilla ${i + 1} asignada a ${list.name}.`,
            status,
            priority,
            dueDate,
            createdAt,
            updatedAt: baseDate,
            listId: list.id,
            source: "manual",
            isRecurring: false,
            order: i,
            isImportant: priority === "high" || priority === "urgent",
        };

        if (completedAt !== undefined) {
            task.completedAt = completedAt;
        }

        const taskRef = doc(tasksRef);
        insertBatch.set(taskRef, {
            ...task,
            id: taskRef.id
        });
    }

    await insertBatch.commit();
    console.log(`Inserted ${tasksToCreate} tasks distributed across ${lists.length} existing lists.`);
    process.exit(0);
}

seed().catch((error) => {
    console.error(error);
    process.exit(1);
});
