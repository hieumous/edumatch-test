const data = require('./data/applicationData');

Feature('Application');

Data(data).Scenario('create application (data-driven)', async ({ I, current }) => {

  // 🔑 login bằng USER (student)
  const login = await I.sendPostRequest('/api/auth/signin', {
    username: 'student4',
    password: '123456'
  });

  const token = login.data.accessToken;

  I.haveRequestHeaders({
    Authorization: `Bearer ${token}`
  });

  // 🚀 gọi API
  const res = await I.sendPostRequest('/api/applications', current);

  console.log(res.data); // debug nếu lỗi

  I.seeResponseCodeIs(current.expectedStatus);

});