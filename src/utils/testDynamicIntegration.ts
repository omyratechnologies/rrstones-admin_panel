import { configApi } from '@/services/configApi';
import type { Permission, Role } from '@/types/dynamic';

/**
 * Test function to verify dynamic architecture integration with backend
 */
export const testDynamicIntegration = async () => {
  const results = {
    permissions: false,
    roles: false,
    settings: false,
    navigation: false,
    configHealth: false,
    errors: [] as string[]
  };

  try {
    // Test 1: Fetch permissions
    console.log('🔍 Testing permissions API...');
    const permissions: Permission[] = await configApi.getPermissions();
    console.log(`✅ Permissions fetched: ${permissions.length} permissions`);
    results.permissions = true;
  } catch (error) {
    console.error('❌ Permissions test failed:', error);
    results.errors.push(`Permissions: ${error}`);
  }

  try {
    // Test 2: Fetch roles
    console.log('🔍 Testing roles API...');
    const roles: Role[] = await configApi.getRoles();
    console.log(`✅ Roles fetched: ${roles.length} roles`);
    results.roles = true;
  } catch (error) {
    console.error('❌ Roles test failed:', error);
    results.errors.push(`Roles: ${error}`);
  }

  try {
    // Test 3: Fetch settings
    console.log('🔍 Testing settings API...');
    const settings = await configApi.getSettings();
    console.log(`✅ Settings fetched: ${settings.length} settings`);
    results.settings = true;
  } catch (error) {
    console.error('❌ Settings test failed:', error);
    results.errors.push(`Settings: ${error}`);
  }

  try {
    // Test 4: Generate navigation
    console.log('🔍 Testing navigation generation...');
    const navigation = await configApi.getNavigation();
    console.log(`✅ Navigation generated: ${navigation.length} items`);
    results.navigation = true;
  } catch (error) {
    console.error('❌ Navigation test failed:', error);
    results.errors.push(`Navigation: ${error}`);
  }

  try {
    // Test 5: Config health check
    console.log('🔍 Testing config health...');
    const health = await configApi.getConfigHealth();
    console.log(`✅ Config health: ${health.status}`);
    results.configHealth = health.status === 'healthy';
  } catch (error) {
    console.error('❌ Config health test failed:', error);
    results.errors.push(`Config Health: ${error}`);
  }

  // Summary
  const successCount = Object.values(results).filter(v => v === true).length;
  const totalTests = 5;
  
  console.log('\n📊 Dynamic Integration Test Results:');
  console.log('=====================================');
  console.log(`✅ Passed: ${successCount}/${totalTests} tests`);
  console.log(`❌ Failed: ${totalTests - successCount}/${totalTests} tests`);
  
  if (results.errors.length > 0) {
    console.log('\n🚨 Errors:');
    results.errors.forEach(error => console.log(`   - ${error}`));
  }

  if (successCount === totalTests) {
    console.log('\n🎉 All tests passed! Dynamic architecture is properly integrated.');
  } else {
    console.log('\n⚠️  Some tests failed. Check backend connectivity and authentication.');
  }

  return results;
};

/**
 * Test specific dynamic features
 */
export const testDynamicFeatures = async () => {
  console.log('\n🧪 Testing Dynamic Features:');
  console.log('=============================');

  try {
    // Test dynamic settings creation
    console.log('🔍 Testing dynamic settings...');
    const dynamicSettings = await configApi.getDynamicSettings('system');
    console.log(`✅ Dynamic settings: ${dynamicSettings.length} settings loaded`);

    // Test feature flags
    console.log('🔍 Testing feature flags...');
    const featureFlags = await configApi.getFeatureFlags();
    console.log(`✅ Feature flags: ${featureFlags.length} flags loaded`);

    // Test themes
    console.log('🔍 Testing themes...');
    const themes = await configApi.getThemes();
    console.log(`✅ Themes: ${themes.length} themes loaded`);

    // Test app config
    console.log('🔍 Testing app config...');
    const appConfig = await configApi.getAppConfig();
    console.log(`✅ App config loaded (version: ${appConfig.version})`);

    console.log('\n🎉 All dynamic features working properly!');
    return true;
  } catch (error) {
    console.error('❌ Dynamic features test failed:', error);
    return false;
  }
};

/**
 * Run all integration tests
 */
export const runAllTests = async () => {
  console.log('🚀 Starting Dynamic Architecture Integration Tests...\n');
  
  const integrationResults = await testDynamicIntegration();
  const featuresResults = await testDynamicFeatures();
  
  const overallSuccess = integrationResults.errors.length === 0 && featuresResults;
  
  console.log('\n🏁 Final Results:');
  console.log('=================');
  console.log(`🔗 Backend Integration: ${integrationResults.errors.length === 0 ? '✅ Success' : '❌ Failed'}`);
  console.log(`⚡ Dynamic Features: ${featuresResults ? '✅ Success' : '❌ Failed'}`);
  console.log(`🎯 Overall Status: ${overallSuccess ? '✅ ALL SYSTEMS GO!' : '❌ Issues Detected'}`);
  
  return overallSuccess;
};
