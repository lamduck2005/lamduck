<script setup>
import { Icon } from '@iconify/vue'

import { useSidebarStore } from '@/stores/sidebar'
import { storeToRefs } from 'pinia'

const sidebarStore = useSidebarStore()
// Dùng storeToRefs để giữ tính reactive khi destruct
const { isSidebarOpen } = storeToRefs(sidebarStore)

const menuItems = [
  { name: 'Dashboard', icon: 'material-symbols:dashboard', active: true },
  { name: 'QR Code Generator', icon: 'material-symbols:qr-code-2', active: false },
  { name: 'Password Generator', icon: 'material-symbols:lock-reset', active: false },
  { name: 'JSON Formatter', icon: 'material-symbols:data-object', active: false },
  { name: 'Text Tools', icon: 'material-symbols:text-fields', active: false },
]
</script>

<template>
  <aside 
    :class="[
      'flex w-64 flex-col bg-white dark:bg-[#151515] border-r border-slate-200 dark:border-white/5 overflow-hidden shadow-2xl z-20 h-full transition-all duration-300',
      isSidebarOpen ? 'translate-x-0 ml-0' : '-translate-x-full -ml-64'
    ]"
  >
    <div class="flex items-center justify-between p-3 border-b border-slate-100 dark:border-white/5 shrink-0">
      <span class="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Navigation</span>
      <button 
        @click="sidebarStore.toggleSidebar()"
        class="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 transition-colors"
      >
        <Icon icon="material-symbols:first-page" class="text-[18px]" />
      </button>
    </div>

    <div class="flex-1 overflow-y-auto sidebar-scroll py-2 px-2 space-y-0.5">
      <template v-for="item in menuItems" :key="item.name">
        <a 
          href="#" 
          :class="[
            'relative flex items-center gap-3 px-3 py-2 rounded-lg transition-all group text-sm',
            item.active 
              ? 'bg-primary/10 text-primary font-medium' 
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-primary dark:hover:text-primary'
          ]"
        >
          <div v-if="item.active" class="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-primary rounded-r-full"></div>
          <Icon :icon="item.icon" class="text-[20px] transition-transform group-hover:scale-110" />
          {{ item.name }}
        </a>
      </template>

      <div class="my-2 border-t border-slate-100 dark:border-white/5"></div>
      
      <p class="px-3 text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 mt-2">Preferences</p>
      <a href="#" class="flex items-center gap-3 px-3 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-primary dark:hover:text-primary rounded-lg transition-colors group text-sm">
        <Icon icon="material-symbols:settings" class="text-[20px] group-hover:scale-110 transition-transform" />
        Settings
      </a>
    </div>
  </aside>
</template>

<style scoped>
.sidebar-scroll::-webkit-scrollbar {
  width: 2px;
}
.sidebar-scroll::-webkit-scrollbar-thumb {
  background-color: #333;
  border-radius: 20px;
}
</style>