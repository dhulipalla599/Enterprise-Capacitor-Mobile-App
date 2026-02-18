<template>
  <div class="p-4">
    <h2 class="text-2xl font-bold mb-4">Profile</h2>
    
    <div class="bg-gray-800 rounded-lg p-4 mb-4">
      <div class="flex items-center space-x-4 mb-4">
        <div class="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center text-2xl font-bold">
          JD
        </div>
        <div>
          <div class="font-semibold">John Doe</div>
          <div class="text-sm text-gray-400">Field Technician</div>
        </div>
      </div>
      <div class="text-sm text-gray-400">
        <div>Email: john.doe@example.com</div>
        <div>ID: EMP-001</div>
      </div>
    </div>

    <div class="space-y-3">
      <button 
        @click="testBiometrics"
        class="w-full bg-gray-800 hover:bg-gray-700 text-left py-3 px-4 rounded-lg"
      >
        Test Biometric Auth
      </button>
      
      <button 
        @click="syncData"
        class="w-full bg-gray-800 hover:bg-gray-700 text-left py-3 px-4 rounded-lg"
      >
        Sync Offline Data
      </button>
      
      <button class="w-full bg-red-900 hover:bg-red-800 text-left py-3 px-4 rounded-lg">
        Logout
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { biometricsService } from '../services/native/biometrics.service';
import { useOfflineSync } from '../composables/useOfflineSync';

const { manualSync } = useOfflineSync();

async function testBiometrics() {
  try {
    const authenticated = await biometricsService.authenticate('Authenticate to continue');
    alert(authenticated ? 'Authenticated!' : 'Authentication failed');
  } catch (error: any) {
    alert(error.message);
  }
}

async function syncData() {
  try {
    await manualSync();
    alert('Data synced successfully');
  } catch (error: any) {
    alert('Sync failed: ' + error.message);
  }
}
</script>
