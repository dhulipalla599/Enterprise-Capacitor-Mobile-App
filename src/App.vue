<template>
  <div id="app" class="min-h-screen bg-gray-900 text-gray-100">
    <!-- Header -->
    <header class="bg-gray-800 border-b border-gray-700 px-4 py-3 sticky top-0 z-50">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <div class="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
            <span class="text-white font-bold text-sm">IoT</span>
          </div>
          <h1 class="text-lg font-semibold">Field App</h1>
        </div>
        
        <div class="flex items-center space-x-3">
          <!-- Network status -->
          <div 
            :class="isOnline ? 'bg-green-500' : 'bg-red-500'"
            class="w-2 h-2 rounded-full"
            :title="isOnline ? 'Online' : 'Offline'"
          />
          
          <!-- Pending ops badge -->
          <div 
            v-if="pendingOpsCount > 0" 
            class="px-2 py-1 bg-yellow-900 text-yellow-300 text-xs rounded"
          >
            {{ pendingOpsCount }} pending
          </div>
        </div>
      </div>
    </header>

    <!-- Main content -->
    <main class="pb-20">
      <router-view />
    </main>

    <!-- Bottom navigation -->
    <nav class="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 px-4 py-2">
      <div class="flex justify-around items-center">
        <router-link 
          to="/dashboard" 
          class="flex flex-col items-center space-y-1 p-2"
          :class="$route.path === '/dashboard' ? 'text-green-400' : 'text-gray-400'"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span class="text-xs">Dashboard</span>
        </router-link>

        <router-link 
          to="/inspections" 
          class="flex flex-col items-center space-y-1 p-2"
          :class="$route.path === '/inspections' ? 'text-green-400' : 'text-gray-400'"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <span class="text-xs">Inspections</span>
        </router-link>

        <router-link 
          to="/devices" 
          class="flex flex-col items-center space-y-1 p-2"
          :class="$route.path === '/devices' ? 'text-green-400' : 'text-gray-400'"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
          </svg>
          <span class="text-xs">Devices</span>
        </router-link>

        <router-link 
          to="/profile" 
          class="flex flex-col items-center space-y-1 p-2"
          :class="$route.path === '/profile' ? 'text-green-400' : 'text-gray-400'"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span class="text-xs">Profile</span>
        </router-link>
      </div>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useOfflineSync } from './composables/useOfflineSync';

const { isOnline, pendingOps } = useOfflineSync();
const pendingOpsCount = computed(() => pendingOps.value.length);
</script>
