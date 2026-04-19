module.exports = [
  // ✅ đúng
  { username: 'employer3', password: 'password123', expectedStatus: 200 },
  { username: 'admin', password: 'admin123', expectedStatus: 200 },
  { username: 'student4', password: '123456', expectedStatus: 200 },

  // ❌ sai
  { username: 'fake_user', password: '123456', expectedStatus: 401 },
  { username: 'student4', password: '12345', expectedStatus: 401 }
];