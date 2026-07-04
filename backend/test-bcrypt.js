import bcrypt from 'bcryptjs';

const hash = "$2a$10$UMPcrjblcx0XE282xGN/tu9SPqyCnt0eq/ISN.8n8eb0JA25xZOMe";
console.log("admin123:", bcrypt.compareSync("admin123", hash));
console.log("password:", bcrypt.compareSync("password", hash));
console.log("12345678:", bcrypt.compareSync("12345678", hash));
