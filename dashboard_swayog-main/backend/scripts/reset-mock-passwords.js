import fs from 'fs';
import bcrypt from 'bcryptjs';
import path from 'path';

// Get the correct path resolving from the backend root
const runtimePath = path.resolve('mock-users.runtime.json');
const seedPath = path.resolve('mock-users.json');

console.log("Resetting mock user passwords...");

const resetPasswordsForFile = (filePath) => {
  if (!fs.existsSync(filePath)) {
    console.log(`Skipping ${filePath} (File not found)`);
    return;
  }

  let users = [];
  try {
    users = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    console.error(`Error reading ${filePath}:`, e.message);
    return;
  }

  if (!Array.isArray(users)) {
    console.log(`Skipping ${filePath} (Invalid format)`);
    return;
  }

  const defaultHash = bcrypt.hashSync("password123", 12);
  const adminHash = bcrypt.hashSync("admin123", 12);

  let updatedCount = 0;
  for (const user of users) {
    const previousHash = user.passwordHash;
    if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') {
      user.passwordHash = adminHash;
    } else {
      user.passwordHash = defaultHash;
    }
    if (user.passwordHash !== previousHash) {
      updatedCount++;
    }
  }

  if (updatedCount > 0) {
    fs.writeFileSync(filePath, JSON.stringify(users, null, 2));
    console.log(`✅ Updated ${updatedCount} passwords in ${path.basename(filePath)}`);
  } else {
    console.log(`No passwords needed updating in ${path.basename(filePath)}`);
  }
};

resetPasswordsForFile(runtimePath);
resetPasswordsForFile(seedPath);

console.log("\nSuccess! Default mock passwords are now:");
console.log(" - SUPER_ADMIN / ADMIN : admin123");
console.log(" - EMPLOYEE / CUSTOMER / PARTNER : password123");
console.log("\n⚠️ IMPORTANT: You must restart your backend server (npm run dev) to load the new passwords into memory.");
