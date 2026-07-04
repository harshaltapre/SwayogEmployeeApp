async function run() {
  const url = process.env.API_BASE_URL || "http://127.0.0.1:4000/api/v1/auth/login";
  const identifier = process.env.TEST_IDENTIFIER || "harshaltapre27@gmail.com";
  const password = process.env.TEST_PASSWORD || "Harshal.27";
  const role = process.env.TEST_ROLE || "SUPER_ADMIN";

  const body = {
    identifier,
    password,
    role
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    console.log("Response Status:", res.status);

    if (!res.ok) {
      console.error(`HTTP Error: ${res.status} ${res.statusText}`);
      const text = await res.text();
      console.error("Error Response:", text);
      process.exit(1);
    }

    const text = await res.text();
    try {
      const json = JSON.parse(text);
      console.log("Response Body:", JSON.stringify(json, null, 2));
    } catch {
      console.log("Raw Response Text:", text);
    }
  } catch (err: unknown) {
    console.error("Request failed:", err);
    if (err instanceof Error) {
      console.error("Error message:", err.message);
    }
    process.exit(1);
  }

  process.exit(0);
}

run();
