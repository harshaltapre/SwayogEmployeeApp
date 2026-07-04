import http from 'http';

const data = JSON.stringify({
  emailOrPhone: 'harshaltapre26@gmail.com',
  securityCode: 'Password@123',
  mode: 'PASSCODE'
});

const options = {
  hostname: '127.0.0.1',
  port: 4000,
  path: '/api/v1/employee/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', body);
  });
});

req.on('error', (e) => console.error('Error:', e.message));
req.write(data);
req.end();
