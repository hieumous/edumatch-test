const data = require('./data/opportunityData');

Feature('Opportunity');

Data(data).Scenario('create opportunity (data-driven)', async ({ I, current }) => {

  // login
  const login = await I.sendPostRequest('/api/auth/signin', {
    username: 'employer3',
    password: 'password123'
  });

  const token = login.data.accessToken;

  I.haveRequestHeaders({
    Authorization: `Bearer ${token}`
  });

  // create opportunity
  const res = await I.sendPostRequest('/api/opportunities', current);

  I.seeResponseCodeIs(current.expectedStatus);
});