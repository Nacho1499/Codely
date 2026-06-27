import { config } from 'dotenv';
config({ path: '.env.local' });
config();

import { createBackup } from '../lib/backup.service';

async function main() {
  console.log('Starting manual backup...');
  try {
    const metadata = await createBackup();
    console.log('Backup completed successfully!');
    console.log(metadata);
  } catch (error) {
    console.error('Backup failed:', error);
    process.exit(1);
  }
}

main();
