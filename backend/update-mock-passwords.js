import fs from 'fs';
import bcrypt from 'bcryptjs';
import path from 'path';

const runtimePath = path.join(process.cwd(), 'mock-users.runtime.json');
let users = [];
try {
  users = JSON.parse(fs.readFileSync(runtimePath, 'utf8'));
} catch (e) {
  console.error("Error reading file", e);
  process.exit(1);
}

const defaultHash = bcrypt.hashSync("password123", 12);
const adminHash = bcrypt.hashSync("admin123", 12);

let updated = false;
for (const user of users) {
  if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') {
    user.passwordHash = adminHash;
  } else {
    user.passwordHash = defaultHash;
  }
  updated = true;
}

if (updated) {
  fs.writeFileSync(runtimePath, JSON.stringify(users, null, 2));
  console.log("Updated passwords for all mock users.");
}
