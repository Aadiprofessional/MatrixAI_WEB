const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// Test function for getAudioFile API with translated_data
async function testGetAudioFileAPI() {
  try {
    // Sample parameters - replace with actual values
    const uid = '0a147ebe-af99-481b-bcaf-ae70c9aeb8d8';
    const audioid = '0646b5ac-715d-4ee2-93f7-da8a7d443446'; // Replace with actual audio ID
    
    const url = 'https://main-matrixai-server-lujmidrakh.cn-hangzhou.fcapp.run/api/audio/getAudioFile';
    
    console.log('Testing getAudioFile API:', url);
    console.log('Parameters:', { uid, audioid });
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uid,
        audioid
      }),
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers));
    
    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    // Check if translated_data exists in response
    if (data.translated_data) {
      console.log('\n=== TRANSLATED DATA FOUND ===');
      console.log('Available languages:', Object.keys(data.translated_data));
      
      // Extract available languages for dropdown
      const availableLanguages = extractAvailableLanguages(data.translated_data);
      console.log('\n=== LANGUAGE DROPDOWN OPTIONS ===');
      availableLanguages.forEach(lang => {
        console.log(`${lang.code}: ${lang.name}`);
      });
      
      // Demo: Show translated text for each language
      console.log('\n=== SAMPLE TRANSLATIONS ===');
      availableLanguages.forEach(lang => {
        console.log(`\n--- ${lang.name} (${lang.code}) ---`);
        showTranslatedText(data.translated_data, lang.code);
      });
    } else {
      console.log('No translated_data found in response');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Function to extract available languages from translated_data
function extractAvailableLanguages(translatedData) {
  const languageMap = {
    'en': 'English',
    'es': 'Spanish', 
    'zh-CN': 'Chinese (Simplified)',
    'zh-TW': 'Chinese (Traditional)',
    'fr': 'French',
    'de': 'German',
    'it': 'Italian',
    'pt': 'Portuguese',
    'ru': 'Russian',
    'ja': 'Japanese',
    'ko': 'Korean'
  };
  
  const availableLanguages = [];
  
  // For the actual API response structure, translated_data contains language codes as keys
  if (translatedData && typeof translatedData === 'object') {
    Object.keys(translatedData).forEach(langCode => {
      if (!availableLanguages.find(lang => lang.code === langCode)) {
        availableLanguages.push({
          code: langCode,
          name: languageMap[langCode] || langCode
        });
      }
    });
  }
  
  return availableLanguages.sort((a, b) => a.name.localeCompare(b.name));
}

// Function to show translated text for a specific language
function showTranslatedText(translatedData, languageCode) {
  if (!translatedData || !translatedData[languageCode]) {
    console.log('No translations available for this language');
    return;
  }
  
  const languageData = translatedData[languageCode];
  
  if (languageData.words && Array.isArray(languageData.words)) {
    console.log(`Found ${languageData.words.length} translated words:`);
    
    // Show first 10 translated words as sample
    languageData.words.slice(0, 10).forEach((wordData, index) => {
      console.log(`${index + 1}. "${wordData.original_word}" -> "${wordData.word}" (${wordData.start}s-${wordData.end}s)`);
    });
    
    if (languageData.words.length > 10) {
      console.log(`... and ${languageData.words.length - 10} more words`);
    }
  } else {
    console.log('No word-level translations found for this language');
  }
}

// Test function using actual API response data
async function testWithActualApiResponseData() {
  try {
    console.log('\n=== TESTING WITH ACTUAL API RESPONSE DATA ===');
    
    // Read the clean api_response.json file
    const filePath = path.join(__dirname, 'clean_api_response.json');
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const apiResponseData = JSON.parse(fileContent);
    
    console.log('Actual API response data loaded successfully');
    
    // Use the actual translated_data from api_response.json
    const mockApiResponse = {
      success: true,
      audioid: apiResponseData.audioid || 'sample_audio_123',
      status: 'completed',
      audioUrl: apiResponseData.audioUrl || 'https://example.com/audio.mp3',
      transcription: apiResponseData.transcription || 'Sample transcription text...',
      language: apiResponseData.language || 'en',
      duration: apiResponseData.duration || 120,
      uploaded_at: apiResponseData.uploaded_at || new Date().toISOString(),
      translated_data: apiResponseData.translated_data // Use the actual translated_data
    };
    
    console.log('\n=== MOCK API RESPONSE ===');
    console.log('Audio ID:', mockApiResponse.audioid);
    console.log('Status:', mockApiResponse.status);
    console.log('Original Language:', mockApiResponse.language);
    
    // Extract available languages for dropdown
    const availableLanguages = extractAvailableLanguages(mockApiResponse.translated_data);
    console.log('\n=== AVAILABLE LANGUAGES FOR DROPDOWN ===');
    availableLanguages.forEach((lang, index) => {
      console.log(`${index + 1}. ${lang.name} (${lang.code})`);
    });
    
    // Demo: Show how to get translated text for selected language
    console.log('\n=== DEMO: SELECTING SPANISH (es) ===');
    const selectedLanguage = 'es';
    console.log(`Selected language: ${selectedLanguage}`);
    console.log('Translated words with timing information:');
    showTranslatedText(mockApiResponse.translated_data, selectedLanguage);
    
    // Show how to reconstruct full translated text
    console.log('\n=== RECONSTRUCTED TRANSLATED TEXT ===');
    if (mockApiResponse.translated_data[selectedLanguage] && mockApiResponse.translated_data[selectedLanguage].words) {
      const translatedText = mockApiResponse.translated_data[selectedLanguage].words
        .map(word => word.punctuated_word || word.word)
        .join(' ');
      console.log('Full translated text:', translatedText);
    }
    
    return {
      availableLanguages,
      translatedData: mockApiResponse.translated_data,
      selectedLanguage
    };
    
  } catch (error) {
    console.error('Error testing with local data:', error.message);
  }
}

// Main execution
async function main() {
  console.log('=== TESTING GETAUDIOFILE API WITH TRANSLATED_DATA ===\n');
  
  // Test 1: Real API call (will likely fail without valid audioid)
  console.log('1. Testing real API call...');
  await testGetAudioFileAPI();
  
  // Test 2: Actual API response data simulation
  console.log('\n2. Testing with actual API response data...');
  const result = await testWithActualApiResponseData();
  
  if (result) {
    console.log('\n=== IMPLEMENTATION GUIDE ===');
    console.log('1. Call getAudioFile API with uid and audioid');
    console.log('2. Check if response contains translated_data field');
    console.log('3. Extract available languages using extractAvailableLanguages()');
    console.log('4. Populate language dropdown with available options');
    console.log('5. When user selects a language, show translated text using showTranslatedText()');
    console.log('6. Display translated paragraphs in the text area');
  }
}

main();