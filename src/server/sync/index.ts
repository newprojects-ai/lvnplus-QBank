import { MasterDataSync } from './masterData';

export async function syncMasterData() {
  const sync = new MasterDataSync();
  
  try {
    await sync.connect();
    await sync.syncMasterData();
  } catch (error) {
    console.error('Master data sync failed:', error);
    throw error;
  } finally {
    await sync.disconnect();
  }
}