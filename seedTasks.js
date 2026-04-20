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

async function seed() {
    console.log("Fetching existing tasks...");
    const snapshot = await getDocs(tasksRef);
    const batchDelete = writeBatch(db);
    let count = 0;
    snapshot.forEach(d => {
        batchDelete.delete(d.ref);
        count++;
    });
    if(count > 0) {
        await batchDelete.commit();
        console.log(`Deleted ${count} old tasks.`);
    }

    // Now insert 20 new tasks
    // Base reference date: "2026-04-12T12:00:00.000Z"
    const todayMillis = new Date("2026-04-12T12:00:00.000Z").getTime();
    const dayMillis = 24 * 60 * 60 * 1000;
    
    const tasks = [];
    
    for (let i = 1; i <= 20; i++) {
        let offsetDays = 0;
        if (i <= 6) offsetDays = -Math.floor(Math.random() * 5 + 1); // Past: -1 to -5 days
        else if (i <= 14) offsetDays = 0; // Today
        else offsetDays = Math.floor(Math.random() * 5 + 1); // Future: 1 to 5 days
        
        const isCompleted = i <= 2; // First 2 past tasks are completed
        const dueDate = todayMillis + (offsetDays * dayMillis);
        
        tasks.push({
            userId,
            title: `Generada Automáticamente ${i} (${offsetDays < 0 ? 'Atrasada' : offsetDays === 0 ? 'Para Hoy' : 'Futura'})`,
            description: "Mock description para validar filtrados",
            status: isCompleted ? "completed" : "todo",
            priority: ["low", "medium", "high", "urgent"][Math.floor(Math.random() * 4)],
            dueDate,
            createdAt: todayMillis - (10 * dayMillis),
            updatedAt: todayMillis,
            completedAt: isCompleted ? todayMillis - dayMillis : undefined,
            tags: ["test"],
            isRecurring: false,
            order: i,
            isImportant: i % 4 === 0,
            isInbox: false
        });
    }

    const batchInsert = writeBatch(db);
    for (const t of tasks) {
        const dRef = doc(tasksRef);
        // Clean undefined manually for Firebase just in case
        const data = { ...t, id: dRef.id };
        if (data.completedAt === undefined) delete data.completedAt;
        batchInsert.set(dRef, data);
    }
    
    await batchInsert.commit();
    console.log("Inserted 20 mock tasks successfully.");
    process.exit(0);
}

seed().catch(err => {
    console.error(err);
    process.exit(1);
});
