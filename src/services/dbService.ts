import { doc, getDoc, setDoc, collection, getDocs, updateDoc, deleteDoc, addDoc, query, where, QueryConstraint, deleteField } from 'firebase/firestore';
import { db } from './firebase';
import { useAuthStore } from '../modules/auth/application/store/authStore';
import { logger } from '../shared/utils/logger';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Object.prototype.toString.call(value) === '[object Object]';
}

function removeUndefinedValues<T>(value: T): T {
  if (Array.isArray(value)) {
    return value
      .filter((item) => item !== undefined)
      .map((item) => removeUndefinedValues(item)) as T;
  }

  if (!isPlainObject(value)) {
    return value;
  }

  const sanitizedEntries = Object.entries(value).flatMap(([key, entryValue]) => {
    if (entryValue === undefined) {
      return [];
    }

    return [[key, removeUndefinedValues(entryValue)]];
  });

  return Object.fromEntries(sanitizedEntries) as T;
}

function replaceUndefinedWithDeleteField(value: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(value).map(([key, entryValue]) => {
      if (entryValue === undefined) {
        return [key, deleteField()];
      }

      if (isPlainObject(entryValue)) {
        return [key, replaceUndefinedWithDeleteField(entryValue)];
      }

      if (Array.isArray(entryValue)) {
        return [key, entryValue.map((item) => (isPlainObject(item) ? replaceUndefinedWithDeleteField(item) : item))];
      }

      return [key, entryValue];
    })
  );
}

function assertAuthorizedCollectionPath(collectionPath: string) {
  if (!collectionPath.startsWith('users/')) {
    return;
  }

  const [, pathUserId] = collectionPath.split('/');
  const currentUserId = useAuthStore.getState().userId;

  if (!currentUserId) {
    throw new Error('Unauthorized Firestore access: there is no authenticated user in memory.');
  }

  if (pathUserId !== currentUserId) {
    throw new Error(`Unauthorized Firestore access: attempted to access user "${pathUserId}" while authenticated as "${currentUserId}".`);
  }
}

export const dbService = {
  // 1. Obtener un solo documento
  async getDocument<T>(collectionPath: string, id: string): Promise<T | null> {
    try {
      assertAuthorizedCollectionPath(collectionPath);
      const docSnap = await getDoc(doc(db, collectionPath, id));
      return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as T : null;
    } catch (error) {
      logger.error(`Error getDocument ${collectionPath}/${id}:`, error);
      throw error;
    }
  },

  // 2. Crear documento con ID dado
  async createDocument<T extends object>(collectionPath: string, id: string, data: T): Promise<void> {
    try {
      assertAuthorizedCollectionPath(collectionPath);
      await setDoc(doc(db, collectionPath, id), removeUndefinedValues(data));
    } catch (error) {
      logger.error(`Error createDocument ${collectionPath}/${id}:`, error);
      throw error;
    }
  },

  // 3. Crear documento con ID autogenerado
  async addDocument<T extends object>(collectionPath: string, data: T): Promise<string> {
    try {
      assertAuthorizedCollectionPath(collectionPath);
      const docRef = await addDoc(collection(db, collectionPath), removeUndefinedValues(data));
      return docRef.id;
    } catch (error) {
      logger.error(`Error addDocument ${collectionPath}:`, error);
      throw error;
    }
  },

  // 4. Actualizar documento parcial
  async updateDocument(collectionPath: string, id: string, data: any): Promise<void> {
    try {
      assertAuthorizedCollectionPath(collectionPath);
      await updateDoc(doc(db, collectionPath, id), replaceUndefinedWithDeleteField(data));
    } catch (error) {
      logger.error(`Error updateDocument ${collectionPath}/${id}:`, error, {
        payload: data,
      });
      throw error;
    }
  },

  // 5. Query simple manual (ej: where('userId', '==', '123'))
  async queryDocuments<T>(collectionPath: string, field: string, operator: any, value: any): Promise<T[]> {
    try {
      assertAuthorizedCollectionPath(collectionPath);
      const q = query(collection(db, collectionPath), where(field, operator, value));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as T);
    } catch (error) {
      logger.error(`Error queryDocuments ${collectionPath}:`, error);
      throw error;
    }
  },

  // 5.a Obtener todos los documentos de una colección
  async getCollectionDocuments<T>(collectionPath: string): Promise<T[]> {
    try {
      assertAuthorizedCollectionPath(collectionPath);
      const querySnapshot = await getDocs(collection(db, collectionPath));
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as T);
    } catch (error) {
      logger.error(`Error getCollectionDocuments ${collectionPath}:`, error);
      throw error;
    }
  },

  // 5.b Query múltiple manual
  async queryMultiple<T>(collectionPath: string, constraints: QueryConstraint[]): Promise<T[]> {
    try {
      assertAuthorizedCollectionPath(collectionPath);
      const q = query(collection(db, collectionPath), ...constraints);
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as T);
    } catch (error) {
      logger.error(`Error queryMultiple ${collectionPath}:`, error);
      throw error;
    }
  },

  // 6. Upsert (Set with merge)
  async upsertDocument(collectionPath: string, id: string, data: any): Promise<void> {
    try {
      assertAuthorizedCollectionPath(collectionPath);
      await setDoc(doc(db, collectionPath, id), removeUndefinedValues(data), { merge: true });
    } catch (error) {
      logger.error(`Error upsertDocument ${collectionPath}/${id}:`, error);
      throw error;
    }
  },

  // 7. Eliminar documento
  async deleteDocument(collectionPath: string, id: string): Promise<void> {
    try {
      assertAuthorizedCollectionPath(collectionPath);
      await deleteDoc(doc(db, collectionPath, id));
    } catch (error) {
      logger.error(`Error deleteDocument ${collectionPath}/${id}:`, error);
      throw error;
    }
  }
};
