<template>
  <div class="p-4">
    <h2 class="text-2xl font-bold mb-4">Dashboard</h2>

    <!-- Stats Grid -->
    <div class="grid grid-cols-2 gap-4 mb-6">
      <div class="bg-gray-800 rounded-lg p-4">
        <div class="text-gray-400 text-sm mb-1">Devices</div>
        <div class="text-2xl font-bold text-green-400">24</div>
      </div>
      <div class="bg-gray-800 rounded-lg p-4">
        <div class="text-gray-400 text-sm mb-1">Online</div>
        <div class="text-2xl font-bold text-green-400">22</div>
      </div>
      <div class="bg-gray-800 rounded-lg p-4">
        <div class="text-gray-400 text-sm mb-1">Inspections</div>
        <div class="text-2xl font-bold text-blue-400">8</div>
      </div>
      <div class="bg-gray-800 rounded-lg p-4">
        <div class="text-gray-400 text-sm mb-1">Pending</div>
        <div class="text-2xl font-bold text-yellow-400">3</div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="mb-6">
      <h3 class="text-lg font-semibold mb-3">Quick Actions</h3>
      <div class="space-y-3">
        <button 
          @click="startInspection"
          class="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg flex items-center justify-center space-x-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          <span>New Inspection</span>
        </button>

        <button 
          @click="capturePhoto"
          class="w-full bg-gray-700 hover:bg-gray-600 text-white py-3 px-4 rounded-lg flex items-center justify-center space-x-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>Take Photo</span>
        </button>

        <button 
          @click="getLocation"
          class="w-full bg-gray-700 hover:bg-gray-600 text-white py-3 px-4 rounded-lg flex items-center justify-center space-x-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>Get Location</span>
        </button>
      </div>
    </div>

    <!-- Recent Activity -->
    <div>
      <h3 class="text-lg font-semibold mb-3">Recent Activity</h3>
      <div class="space-y-2">
        <div 
          v-for="activity in recentActivities" 
          :key="activity.id"
          class="bg-gray-800 rounded-lg p-3"
        >
          <div class="flex items-center justify-between">
            <div>
              <div class="font-medium">{{ activity.title }}</div>
              <div class="text-sm text-gray-400">{{ activity.time }}</div>
            </div>
            <div 
              :class="statusClass(activity.status)"
              class="px-2 py-1 text-xs rounded"
            >
              {{ activity.status }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { cameraService } from '../services/native/camera.service';
import { geolocationService } from '../services/native/geolocation.service';

const router = useRouter();

const recentActivities = ref([
  { id: 1, title: 'Device MTR-001 inspected', time: '2 hours ago', status: 'completed' },
  { id: 2, title: 'Meter reading uploaded', time: '4 hours ago', status: 'synced' },
  { id: 3, title: 'Offline inspection pending', time: '1 day ago', status: 'pending' },
]);

function statusClass(status: string) {
  return {
    'bg-green-900 text-green-300': status === 'completed' || status === 'synced',
    'bg-yellow-900 text-yellow-300': status === 'pending',
    'bg-red-900 text-red-300': status === 'failed',
  };
}

function startInspection() {
  router.push('/inspections');
}

async function capturePhoto() {
  try {
    const photo = await cameraService.capturePhoto();
    console.log('Photo captured:', photo);
    alert('Photo captured successfully!');
  } catch (error) {
    console.error('Camera error:', error);
    alert('Failed to capture photo');
  }
}

async function getLocation() {
  try {
    const location = await geolocationService.getCurrentPosition();
    alert(`Location: ${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`);
  } catch (error) {
    console.error('Location error:', error);
    alert('Failed to get location');
  }
}
</script>
