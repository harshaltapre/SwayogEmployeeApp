const http = require('http');

function doLookup(identifier) {
  return new Promise((resolve) => {
    const encoded = encodeURIComponent(identifier);
    const req = http.request({
      hostname: '127.0.0.1', port: 4000,
      path: `/api/v1/employee/lookup?identifier=${encoded}`, method: 'GET'
    }, (res) => {
      let result = '';
      res.on('data', (c) => result += c);
      res.on('end', () => { console.log(`[Lookup: ${identifier}] Status:${res.statusCode} => ${result}`); resolve(); });
    });
    req.on('error', (e) => { console.error(`[Lookup] Error: ${e.message}`); resolve(); });
    req.end();
  });
}

(async () => {
  await doLookup('EMP-EIPESY');
  await doLookup('harshaltapre26@gmail.com');
  await doLookup('9322184006');
  await doLookup('invalid-id');
})();
