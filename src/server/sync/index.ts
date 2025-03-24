import { MasterDataSync } from './masterData';

async function main() {
  const sync = new MasterDataSync();
  
  try {
    console.log('Starting master data synchronization process...');
    await sync.connect();
    await sync.syncMasterData();
    console.log('Master data synchronization completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Master data sync failed:', error);
    process.exit(1);
  } finally {
    await sync.disconnect();
  }
}

// Execute the sync process
main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});