<script setup>
import { Icon } from "@iconify/vue";
import { computed } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

const tools = computed(() => {
  return router.getRoutes().filter(route => route.meta.showInHome)
});

const activities = [
  {
    title: "Comming soon",
    time: "Coming soon",
    icon: "material-symbols:qr-code-2",
    color: "bg-primary/10 text-primary",
  },
];
</script>

<template>
  <main class="flex-1 overflow-y-auto bg-slate-50 dark:bg-background-dark p-4 md:p-6 pb-24 transition-all duration-300">
    <div class="mb-8">
      <h2 class="text-2xl font-bold mb-1">Welcome back, Developer</h2>
      <p class="text-slate-500 dark:text-slate-400">
        Here are your most used utilities.
      </p>
    </div>

    <div class="grid grid-cols-2 gap-3 mb-8">
      <div class="bg-white dark:bg-surface-dark p-4 rounded-xl border border-slate-200 dark:border-white/5 shadow-sm">
        <div class="flex items-center gap-2 mb-2">
          <span class="w-2 h-2 rounded-full bg-green-500"></span>
          <span class="text-xs font-medium text-slate-400 uppercase">System Status</span>
        </div>
        <div class="text-lg font-bold">Working</div>
      </div>
      <div class="bg-white dark:bg-surface-dark p-4 rounded-xl border border-slate-200 dark:border-white/5 shadow-sm">
        <div class="flex items-center gap-2 mb-2">
          <Icon icon="material-symbols:bolt" class="text-primary text-[16px]" />
          <span class="text-xs font-medium text-slate-400 uppercase">Web Status</span>
        </div>
        <div class="text-lg font-bold">Work in progress</div>
      </div>
    </div>

    <div class="mb-4 flex items-center justify-between">
      <h3 class="text-lg font-bold">All Tools</h3>
      <button class="text-xs text-primary font-bold hover:underline disabled:text-slate-400 disabled:hover:underline-none" disabled>
        View more
      </button>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="tool in tools" :key="tool.name"
        class="group relative bg-white dark:bg-surface-dark p-5 rounded-xl border border-slate-200 dark:border-white/5 hover:border-primary/50 transition-all duration-300 shadow-sm hover:shadow-lg cursor-pointer overflow-hidden select-none"
        @click="router.push(tool.path)">
        <div class="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <Icon icon="material-symbols:arrow-outward" class="text-slate-400 text-[20px]" />
        </div>
        <div :class="[
          'w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-colors group-hover:bg-primary group-hover:text-white',
          tool.meta.color,
        ]">
          <Icon :icon="tool.meta.icon" class="text-[28px]" />
        </div>
        <h4 class="text-base font-bold dark:text-white mb-1">
          {{ tool.meta.title }}
        </h4>
        <p class="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
          {{ tool.meta.description }}
        </p>
      </div>
    </div>

    <div class="mt-8">
      <h3 class="text-lg font-bold mb-4">Recent Activity</h3>
      <div
        class="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-white/5 divide-y divide-slate-100 dark:divide-white/5">
        <div v-for="act in activities" :key="act.title"
          class="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer">
          <div class="flex items-center gap-4">
            <div :class="['p-2 rounded', act.color]">
              <Icon :icon="act.icon" class="text-[20px]" />
            </div>
            <div>
              <h5 class="text-sm font-semibold">{{ act.title }}</h5>
              <p class="text-xs text-slate-500">{{ act.time }}</p>
            </div>
          </div>
          <Icon icon="material-symbols:chevron-right" class="text-slate-500 text-[20px]" />
        </div>
      </div>
    </div>

    <button
      class="md:hidden fixed bottom-6 right-6 h-14 w-14 rounded-full bg-primary text-white shadow-lg shadow-primary/40 flex items-center justify-center z-40 active:scale-95 transition-transform">
      <Icon icon="material-symbols:search" class="text-[28px]" />
    </button>
  </main>
</template>
