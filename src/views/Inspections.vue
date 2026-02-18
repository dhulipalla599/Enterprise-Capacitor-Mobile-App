<template>
  <div class="p-4">
    <h2 class="text-2xl font-bold mb-4">Inspections</h2>
    <p class="text-gray-400 mb-6">Manage device inspections and meter readings</p>

    <div class="space-y-3">
      <div 
        v-for="inspection in inspections" 
        :key="inspection.id"
        class="bg-gray-800 rounded-lg p-4"
      >
        <div class="flex items-center justify-between mb-2">
          <div class="font-semibold">{{ inspection.deviceId }}</div>
          <div 
            :class="statusBadge(inspection.status)"
            class="px-2 py-1 text-xs rounded"
          >
            {{ inspection.status }}
          </div>
        </div>
        <div class="text-sm text-gray-400">{{ inspection.location }}</div>
        <div class="text-xs text-gray-500 mt-1">{{ inspection.date }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const inspections = ref([
  { id: 1, deviceId: 'MTR-001', location: 'Building A', status: 'completed', date: '2024-02-17' },
  { id: 2, deviceId: 'MTR-002', location: 'Building B', status: 'pending', date: '2024-02-17' },
  { id: 3, deviceId: 'MTR-003', location: 'Building C', status: 'synced', date: '2024-02-16' },
]);

function statusBadge(status: string) {
  return {
    'bg-green-900 text-green-300': status === 'completed' || status === 'synced',
    'bg-yellow-900 text-yellow-300': status === 'pending',
  };
}
</script>
