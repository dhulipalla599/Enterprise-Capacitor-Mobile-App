<template>
  <div class="p-4">
    <h2 class="text-2xl font-bold mb-4">Devices</h2>
    <div class="grid grid-cols-1 gap-3">
      <div 
        v-for="device in devices" 
        :key="device.id"
        class="bg-gray-800 rounded-lg p-4 border-l-4"
        :class="device.status === 'online' ? 'border-green-500' : 'border-red-500'"
      >
        <div class="flex items-center justify-between">
          <div>
            <div class="font-semibold">{{ device.id }}</div>
            <div class="text-sm text-gray-400">{{ device.type }}</div>
          </div>
          <div 
            :class="device.status === 'online' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'"
            class="px-2 py-1 text-xs rounded"
          >
            {{ device.status }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const devices = ref([
  { id: 'MTR-001', type: 'Smart Meter', status: 'online' },
  { id: 'MTR-002', type: 'Smart Meter', status: 'online' },
  { id: 'MTR-003', type: 'Smart Meter', status: 'offline' },
]);
</script>
