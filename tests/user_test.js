Feature('User');


// 🔥 1. Get profile (success)
Scenario('get user profile success', async ({ I }) => {

  // login trước
  const login = await I.sendPostRequest('/api/auth/signin', {
    username: 'student4',
    password: '123456'
  });

  const token = login.data.accessToken;

  I.haveRequestHeaders({
    Authorization: `Bearer ${token}`
  });

  const res = await I.sendGetRequest('/api/user/me');

  I.seeResponseCodeIs(200);
});


// ❌ 2. Get profile không có token
Scenario('get user profile fail - no token', async ({ I }) => {

  const res = await I.sendGetRequest('/api/user/me');

  I.seeResponseCodeIs(401);
});


// 🔥 3. Update profile (success)
Scenario('update profile success', async ({ I }) => {

  const login = await I.sendPostRequest('/api/auth/signin', {
    username: 'student4',
    password: '123456'
  });

  const token = login.data.accessToken;

  I.haveRequestHeaders({
    Authorization: `Bearer ${token}`
  });

  const res = await I.sendPutRequest('/api/user/me', {
    fullName: 'Test User Updated',
    bio: 'Testing update profile'
  });

  I.seeResponseCodeIs(200);
});


// ❌ 4. Update profile fail (không token)
Scenario('update profile fail - no token', async ({ I }) => {

  const res = await I.sendPutRequest('/api/user/me', {
    fullName: 'Fail Update'
  });

  I.seeResponseCodeIs(401);
});