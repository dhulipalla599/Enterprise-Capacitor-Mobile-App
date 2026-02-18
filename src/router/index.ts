import { createRouter, createWebHistory } from 'vue-router';
import Dashboard from '../views/Dashboard.vue';
import Inspections from '../views/Inspections.vue';
import Devices from '../views/Devices.vue';
import Profile from '../views/Profile.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/dashboard' },
    { 
      path: '/dashboard', 
      name: 'Dashboard',
      component: Dashboard 
    },
    { 
      path: '/inspections', 
      name: 'Inspections',
      component: Inspections 
    },
    { 
      path: '/devices', 
      name: 'Devices',
      component: Devices 
    },
    { 
      path: '/profile', 
      name: 'Profile',
      component: Profile 
    },
  ],
});

export default router;
