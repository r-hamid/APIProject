const environments = {
  staging: {
    httpPort: 3000,
    httpsPort: 3001,
    envName: "staging",
    hashSecret: "ThisIsASecret",
    totalChecksAllowed: 5,
    twilio: {
      accountSid: "AC0c84be4df716bd5620919ce225c2f818",
      authToken: "6881862de62a3c03d7f77dfd917373cb",
      fromPhone: "+12179088755",
    },
    globalTemplateVars: {
      baseUrl: "http://localhost:3000",
      companyName: "NotARealCompany",
      yearCreated: "2023",
      projectTitle: "UpTimeTracker",
    },
  },
  production: {
    httpPort: 5000,
    httpsPort: 5001,
    envName: "production",
    hashSecret: "ThisIsAlsoASecret",
    totalChecksAllowed: 5,
  }
};

const envFromStartCommand = process.env.NODE_ENV || "staging";

export default environments[envFromStartCommand];
