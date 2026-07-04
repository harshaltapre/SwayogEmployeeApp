import axios from 'axios';

async function main() {
  try {
    const res = await axios.get('https://waareecloud.ai/assets/runtime-config.js');
    console.log("Runtime Config:\n", res.data);
  } catch (err) {
    console.error("Failed:", err.message);
  }
}

main();
