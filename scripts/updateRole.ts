import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc, getDocs, collection } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function run() {
  try {
    const snap = await getDocs(collection(db, 'users'));
    for (let docSnap of snap.docs) {
       console.log(docSnap.data().email);
       if (docSnap.data().email === 'drthurein.sdcu@gmail.com') {
          await updateDoc(doc(db, 'users', docSnap.id), { role: 'admin' });
          console.log('Updated to admin:', docSnap.data().email);
       }
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
