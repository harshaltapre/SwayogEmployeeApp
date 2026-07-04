

async function main() {
  // Login to get token
  const loginRes = await fetch("http://localhost:4000/api/v1/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      identifier: "harshaltapre27@gmail.com",
      password: "Harshal.27",
      role: "SUPER_ADMIN"
    })
  });
  
  if (!loginRes.ok) {
    const err = await loginRes.text();
    console.log("Login failed", err);
    return;
  }
  
  const loginData: any = await loginRes.json();
  const token = loginData.data.accessToken;

  // Create customer
  const createRes = await fetch("http://localhost:4000/api/v1/customers", {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      fullName: "Api Testing",
      email: "fresh" + Date.now() + "@example.com",
      phoneNumber: "98765" + Math.floor(Math.random() * 10000),
      city: "Punex",
      address: "123 Street Test",
      systemSizeKw: 10,
      installationDate: new Date().toISOString(),
      amcStatus: "none",
      status: "active"
    })
  });

  if (!createRes.ok) {
    console.error("Create Customer failed with exact message:");
    const err = await createRes.text();
    console.error(err);
  } else {
    console.log("Create Customer succeeded!");
    console.log(await createRes.json());
  }
}

main().catch(console.error);
