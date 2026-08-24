import { getFromR2 } from "./services/r2StorageService.js";

async function testOlderObject() {
  const key1 = "tasks/995109d0-d81d-44fa-b662-de3ee8f44d20/before/8940da91-ceef-4de1-b1da-3c07ec4d6ba8.jpg";
  const key2 = "tasks/995109d0-d81d-44fa-b662-de3ee8f44d20/after/1c6a4820-d3ed-4f9d-a221-e9d3cd791f3f.jpg";

  console.log("Checking key1 in R2...");
  try {
    const buf1 = await getFromR2(key1);
    console.log("Found key1 in R2, size:", buf1.length);
  } catch (err: any) {
    console.log("Key1 not in R2:", err.message);
  }

  console.log("Checking key2 in R2...");
  try {
    const buf2 = await getFromR2(key2);
    console.log("Found key2 in R2, size:", buf2.length);
  } catch (err: any) {
    console.log("Key2 not in R2:", err.message);
  }

  const keyRecent = "tasks/907aedd2-cade-4d6f-ac82-3cb67f4bab54/before/39d6b25c-884e-45d9-b5cc-b71efa9f071f.jpg";
  console.log("Checking keyRecent in R2...");
  try {
    const bufRecent = await getFromR2(keyRecent);
    console.log("Found keyRecent in R2, size:", bufRecent.length);
  } catch (err: any) {
    console.log("KeyRecent not in R2:", err.message);
  }
}

testOlderObject();
