import { getGrowattSession } from "./lib/growatt.js";

async function main() {
  console.log("=== Testing token split for rjm9984lm6t7e69dm9630mniq134341 ===");
  const token = "rjm9984lm6t7e69dm9630mniq134341";
  
  let parsed: { user: string; pass: string } | null = null;
  // Try 24-character match with verification first
  const match = token.match(/^([\w\s.\-@]{3,16})([\w\s.\-@#$!%*?&]{24})$/i);
  if (match) {
    console.log(`Regex match split: usr="${match[1]}", pass="${match[2]}"`);
    try {
      const session = await getGrowattSession(match[1], match[2]);
      if (session) {
        parsed = { user: match[1], pass: match[2] };
      }
    } catch (e: any) {
      console.log(`Regex split failed: ${e.message}`);
    }
  }
  
  // Try dynamic splitting with verification
  if (!parsed) {
    const maxUserLen = Math.min(16, token.length - 6);
    for (let userLen = 3; userLen <= maxUserLen; userLen++) {
      const testUser = token.slice(0, userLen);
      const testPass = token.slice(userLen);
      try {
        console.log(`Trying split: usr="${testUser}", pass="${testPass}"`);
        const session = await getGrowattSession(testUser, testPass);
        if (session) {
          parsed = { user: testUser, pass: testPass };
          console.log(`[SUCCESS] Verified split: usr="${testUser}", pass="${testPass}"`);
          break;
        }
      } catch {
        // ignore
      }
    }
  }
  
  if (parsed) {
    console.log("Final Split Result:", parsed);
  } else {
    console.log("Failed to find any working split for this token.");
  }
}

main();
