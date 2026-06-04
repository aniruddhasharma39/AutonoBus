/**
 * list_dbs.mjs  — lists all local databases and their collections
 * Run: node list_dbs.mjs
 */
import { MongoClient } from 'mongodb';

const client = new MongoClient('mongodb://127.0.0.1:27017');

async function run() {
  await client.connect();
  const adminDb = client.db('admin');
  const { databases } = await adminDb.admin().listDatabases();

  console.log('\n📋 Local MongoDB Databases:\n');
  for (const db of databases) {
    const cols = await client.db(db.name).listCollections().toArray();
    const sizeMB = (db.sizeOnDisk / 1024 / 1024).toFixed(2);
    console.log(`  📁 ${db.name}  (${sizeMB} MB, ${cols.length} collections)`);
    for (const col of cols) {
      const count = await client.db(db.name).collection(col.name).countDocuments();
      console.log(`       └─ ${col.name}: ${count} docs`);
    }
  }
  await client.close();
}

run().catch(console.error);
