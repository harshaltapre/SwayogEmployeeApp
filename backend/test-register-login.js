import http from 'http';

const registerData = JSON.stringify({
  fullName: "Test Customer",
  email: "test.customer@gmail.com",
  phoneNumber: "1234567890",
  password: "password123",
  role: "CUSTOMER"
});

const registerOptions = {
  hostname: 'localhost',
  port: 4000,
  path: '/api/v1/auth/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': registerData.length
  }
};

const req = http.request(registerOptions, res => {
  console.log(`Register statusCode: ${res.statusCode}`);
  let responseData = '';
  res.on('data', d => {
    responseData += d;
  });
  res.on('end', () => {
    console.log("Register response:", responseData);

    // Now try to login
    const loginData = JSON.stringify({
      identifier: "test.customer@gmail.com",
      password: "password123",
      role: "CUSTOMER"
    });

    const loginOptions = {
      hostname: 'localhost',
      port: 4000,
      path: '/api/v1/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': loginData.length
      }
    };

    const loginReq = http.request(loginOptions, loginRes => {
      console.log(`Login statusCode: ${loginRes.statusCode}`);
      loginRes.on('data', d => {
        process.stdout.write(d);
      });
    });

    loginReq.on('error', console.error);
    loginReq.write(loginData);
    loginReq.end();
  });
});

req.on('error', console.error);
req.write(registerData);
req.end();
