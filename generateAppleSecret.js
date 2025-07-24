const fs = require('fs');
const jwt = require('jsonwebtoken');

// Replace with your actual values
const teamId = '75NR4WL287'; // Replace with your Apple Developer Team ID
const clientId = 'com.matrixai.web';
const keyId = 'J68BMZW6KS'; // Extracted from the key filename
const privateKey = fs.readFileSync('/Users/aadisrivastava/Downloads/project/MatrixAI/MatrixAI_Web/aiagent/AuthKey_J68BMZW6KS.p8', 'utf8');

const token = jwt.sign({}, privateKey, {
  algorithm: 'ES256',
  expiresIn: '180d',
  audience: 'https://appleid.apple.com',
  issuer: teamId,
  subject: clientId,
  keyid: keyId,
});

console.log('Generated OAuth Secret Key:\n', token);