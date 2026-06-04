/**
 * migrate.js
 * Migrates all collections from local MongoDB (GARUDA) to Atlas (test db)
 * Run: node migrate.js
 */

const { MongoClient } = require('mongodb');

const SOURCE_URI = 'mongodb://127.0.0.1:27017';
const SOURCE_DB  = 'GARUDA';

const TARGET_URI = 'mongodb://saniruddha93_db_user:1AkL2lxwR7o2n0bs@ac-pyrtk0j-shard-00-00.fqtcxib.mongodb.net:27017,ac-pyrtk0j-shard-00-01.fqtcxib.mongodb.net:27017,ac-pyrtk0j-shard-00-02.fqtcxib.mongodb.net:27017/?ssl=true&replicaSet=atlas-r2glat-shard-0&authSource=admin&appName=Cluster0';
const TARGET_DB  = 'test';

async function migrate() {
  const sourceClient = new MongoClient(SOURCE_URI);
  const targetClient = new MongoClient(TARGET_URI);

  try {
    console.log('🔌 Connecting to local MongoDB...');
    await sourceClient.connect();
    console.log('✅ Connected to local MongoDB');

    console.log('🔌 Connecting to Atlas...');
    await targetClient.connect();
    console.log('✅ Connected to MongoDB Atlas');

    const sourceDb = sourceClient.db(SOURCE_DB);
    const targetDb = targetClient.db(TARGET_DB);

    const collections = await sourceDb.listCollections().toArray();
    console.log(`\n📦 Found ${collections.length} collections in "${SOURCE_DB}":\n`);

    for (const colInfo of collections) {
      const name = colInfo.name;
      const sourceColl = sourceDb.collection(name);
      const targetColl = targetDb.collection(name);

      const docs = await sourceColl.find({}).toArray();
      console.log(`  ➡  ${name}: ${docs.length} documents`);

      if (docs.length === 0) {
        console.log(`     (skipped — empty collection)`);
        continue;
      }

      // Drop target collection first for a clean migration
      await targetColl.drop().catch(() => {}); // ignore if doesn't exist

      const result = await targetColl.insertMany(docs);
      console.log(`     ✔  Inserted ${result.insertedCount} documents`);
    }

    console.log('\n🎉 Migration complete! All collections copied to Atlas "test" database.');
  } catch (err) {
    console.error('\n❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await sourceClient.close();
    await targetClient.close();
  }
}

migrate();
