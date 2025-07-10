import { useEffect, useState } from "react";
import { collection, onSnapshot, QuerySnapshot, DocumentData, FirestoreError, query, orderBy } from "firebase/firestore";
import { db, isFirebaseConfigured, firebaseConfigError } from "../firebase";

export function useFirestoreSync<T = DocumentData>(collectionName: string, orderByField: string) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [fromCache, setFromCache] = useState<boolean | null>(null);
  const [error, setError] = useState<FirestoreError | null>(null);

  useEffect(() => {
    // If Firebase isn't configured, set an error immediately and stop.
    if (!isFirebaseConfigured || !db) {
      setError({
        name: 'FirebaseConfigError',
        message: firebaseConfigError || 'Firebase no está configurado.',
        code: 'invalid-argument' // Using a generic code
      } as FirestoreError);
      setLoading(false);
      return;
    }

    const q = query(collection(db, collectionName), orderBy(orderByField));

    const unsubscribe = onSnapshot(
      q,
      { includeMetadataChanges: true },
      (snapshot: QuerySnapshot) => {
        const docs = snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id } as T));
        setData(docs);
        setFromCache(snapshot.metadata.fromCache);
        setLoading(false);
        setError(null); // Clear previous errors on successful fetch
      },
      (err: FirestoreError) => {
        console.error(`Error en Firestore (${collectionName}):`, err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [collectionName, orderByField]);

  return { data, loading, fromCache, error };
}
