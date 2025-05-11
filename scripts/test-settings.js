/**
 * Test script for settings API endpoints
 * 
 * This script tests the create, read, update, and delete operations
 * for the settings API to verify persistence between application restarts.
 */

import axios from 'axios';

// Base URL for API requests
const baseUrl = process.env.BASE_URL || 'https://ab447727-be64-4365-9025-c7bc8397bb93-00-vsrv01v76xvi.sisko.replit.dev';

// Utility function to make requests with consistent error handling
async function makeRequest(method, endpoint, data = null) {
  try {
    const url = `${baseUrl}${endpoint}`;
    console.log(`Making ${method} request to ${url}`);
    
    const config = {
      method,
      url,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    console.log(`Response status: ${response.status}`);
    return response.data;
  } catch (error) {
    console.error(`Error making request: ${error.message}`);
    if (error.response) {
      console.error(`Response status: ${error.response.status}`);
      console.error(`Response data:`, error.response.data);
    }
    throw error;
  }
}

// Test creating a new setting
async function testCreateSetting() {
  console.log('\n=== Testing: Create Setting ===');
  
  const settingData = {
    type: 'transmitter',
    name: 'alarm_settings',
    value: {
      criticalColor: '#FF0000',
      warningColor: '#FFFF00',
      blinkSpeed: 500,
      rotationInterval: 5000,
      enabled: true
    }
  };
  
  try {
    const result = await makeRequest('post', '/api/settings', settingData);
    console.log('Created setting:', result);
    return result;
  } catch (error) {
    console.error('Failed to create setting');
    return null;
  }
}

// Test getting all settings
async function testGetAllSettings() {
  console.log('\n=== Testing: Get All Settings ===');
  
  try {
    const result = await makeRequest('get', '/api/settings');
    console.log(`Retrieved ${result.length} settings`);
    return result;
  } catch (error) {
    console.error('Failed to get settings');
    return [];
  }
}

// Test getting a specific setting by ID
async function testGetSettingById(id) {
  console.log(`\n=== Testing: Get Setting by ID (${id}) ===`);
  
  try {
    const result = await makeRequest('get', `/api/settings/${id}`);
    console.log('Retrieved setting:', result);
    return result;
  } catch (error) {
    console.error(`Failed to get setting with ID ${id}`);
    return null;
  }
}

// Test getting a setting by name and type
async function testGetSettingByName(type, name) {
  console.log(`\n=== Testing: Get Setting by Name (${type}/${name}) ===`);
  
  try {
    const result = await makeRequest('get', `/api/settings/by-name/${type}/${name}`);
    console.log('Retrieved setting:', result);
    return result;
  } catch (error) {
    console.error(`Failed to get setting with type ${type} and name ${name}`);
    return null;
  }
}

// Test updating a setting
async function testUpdateSetting(id, newData) {
  console.log(`\n=== Testing: Update Setting (${id}) ===`);
  
  try {
    const result = await makeRequest('patch', `/api/settings/${id}`, newData);
    console.log('Updated setting:', result);
    return result;
  } catch (error) {
    console.error(`Failed to update setting with ID ${id}`);
    return null;
  }
}

// Test deleting a setting
async function testDeleteSetting(id) {
  console.log(`\n=== Testing: Delete Setting (${id}) ===`);
  
  try {
    await makeRequest('delete', `/api/settings/${id}`);
    console.log(`Successfully deleted setting with ID ${id}`);
    return true;
  } catch (error) {
    console.error(`Failed to delete setting with ID ${id}`);
    return false;
  }
}

// Main test function
async function runTests() {
  console.log('Starting settings API tests...');
  
  // Step 1: Get all existing settings
  const initialSettings = await testGetAllSettings();
  
  // Step 2: Create a new setting
  const createdSetting = await testCreateSetting();
  
  if (createdSetting) {
    // Step 3: Get the newly created setting by ID
    await testGetSettingById(createdSetting.id);
    
    // Step 4: Get the setting by name and type
    await testGetSettingByName(createdSetting.type, createdSetting.name);
    
    // Step 5: Update the setting
    const updateData = {
      value: {
        ...createdSetting.value,
        blinkSpeed: 700,
        rotationInterval: 7000
      }
    };
    await testUpdateSetting(createdSetting.id, updateData);
    
    // Step 6: Get all settings again to verify update
    await testGetAllSettings();
    
    // Step 7: Delete the setting (uncomment to test deletion)
    // await testDeleteSetting(createdSetting.id);
  }
  
  console.log('\nSettings API tests completed!');
}

// Run the tests
runTests().catch(console.error);