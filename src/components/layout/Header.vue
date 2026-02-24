<script setup>
import { useSidebarStore } from '@/stores/sidebar';
import { Icon } from '@iconify/vue';
import { storeToRefs } from 'pinia';

const sidebarStore = useSidebarStore();
const { isSidebarOpen } = storeToRefs(sidebarStore)

</script>

<template>
  <header class="flex items-center justify-between px-4 py-3 bg-white dark:bg-background-dark border-b border-slate-200 dark:border-white/10 shrink-0 z-30">
    <div class="flex items-center gap-3">
      <button 
        @click="sidebarStore.toggleSidebar()"
        class="flex items-center justify-center sticky top-0 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors text-slate-600 dark:text-slate-200"
      >
        <Icon :icon="isSidebarOpen ? 'material-symbols:close' : 'material-symbols:menu'" class="text-[20px]" />
      </button>

      <div class="flex items-center gap-2">
        <h1 class="text-xl font-bold tracking-tight text-fuchsia-300">LamDuck</h1>
      </div>
    </div>

    <div>
      <button class="w-10 h-10 rounded-full overflow-hidden border-2 border-slate-200 dark:border-white/10 active:scale-95 transition-transform">
        <Icon icon="carbon:user-avatar-filled" class="w-full h-full object-cover"></Icon>
      </button>
    </div>
  </header>
</template>