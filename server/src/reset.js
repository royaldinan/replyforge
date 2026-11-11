import { resetDatabase } from './db.js';

console.log('Resetting ReplyForge database to fresh seed...');
resetDatabase({ keepSettings: false });
console.log('Database successfully reset!');
process.exit(0);
