module.exports = [

  // 🔥 SUCCESS
  {
    opportunityId: 1,
    coverLetter: "I am suitable for this scholarship",
    motivation: "I want to learn more",
    gpa: 3.5,
    expectedStatus: 200
  },

  // ❌ thiếu opportunityId
  {
    coverLetter: "Missing opp id",
    motivation: "Test",
    gpa: 3.0,
    expectedStatus: 400
  },

  // ❌ GPA không hợp lệ
  {
    opportunityId: 1,
    coverLetter: "Bad GPA",
    motivation: "Test",
    gpa: -1,
    expectedStatus: 400
  }

];