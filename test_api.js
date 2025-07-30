const fetch = require('node-fetch');

async function testContentAPI() {
  try {
    const url = 'https://main-matrixai-server-lujmidrakh.cn-hangzhou.fcapp.run/api/content/getUserContent?uid=0a147ebe-af99-481b-bcaf-ae70c9aeb8d8&page=1&limit=6';
    
    console.log('Testing API:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers));
    
    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testContentAPI();