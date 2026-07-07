// Quick login test script
const response = await fetch("http://127.0.0.1:4000/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    identifier: "harshaltapre27@gmail.com",
    password: "Harshal.27",
    role: "SUPER_ADMIN",
  }),
});

const data = await response.json();
console.log("Status:", response.status);
console.log("Response:", JSON.stringify(data, null, 2));
