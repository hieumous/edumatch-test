const users = require('./data/authData');

Feature('Auth');


// 🔥 1. Login nhiều user (đúng + sai)
Data(users).Scenario('login multiple users (valid + invalid)', async ({ I, current }) => {

  const res = await I.sendPostRequest('/api/auth/signin', {
    username: current.username,
    password: current.password
  });

  console.log('Testing:', current.username);

  // ✅ check theo expected
  I.seeResponseCodeIs(current.expectedStatus);

  // chỉ check token nếu thành công
  if (current.expectedStatus === 200) {
    I.seeResponseContainsJson({
      accessToken: res.data.accessToken
    });
  }
});


// ❌ 2. Login sai password (test riêng)
Scenario('login fail - wrong password', async ({ I }) => {

  const res = await I.sendPostRequest('/api/auth/signin', {
    username: 'employer3',
    password: 'sai123'
  });

  I.seeResponseCodeIs(401);
});


// ❌ 3. Login thiếu field
Scenario('login fail - missing field', async ({ I }) => {

  const res = await I.sendPostRequest('/api/auth/signin', {
    username: 'employer3'
  });

  I.seeResponseCodeIs(400);
});


// 🔥 4. Verify token 
Scenario('verify token after login', async ({ I }) => {

  const login = await I.sendPostRequest('/api/auth/signin', {
    username: 'employer3',
    password: 'password123'
  });

  const token = login.data.accessToken;

  I.haveRequestHeaders({
    Authorization: `Bearer ${token}`
  });

  const res = await I.sendGetRequest('/api/auth/verify');

  I.seeResponseCodeIs(200);
});


// ❌ 5. Verify không có token
Scenario('verify fail - no token', async ({ I }) => {

  const res = await I.sendGetRequest('/api/auth/verify');

  I.seeResponseCodeIs(401);
});