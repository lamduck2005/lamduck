<script setup>
import Header from "./components/layout/Header.vue";
import Sidebar from "./components/layout/Sidebar.vue";
</script>

<template>
  <div class="h-screen flex flex-col overflow-hidden bg-background-light dark:bg-background-dark">
    <Header />
    <div class="flex flex-1 overflow-hidden">
      <Sidebar />
      <router-view />
    </div>
  </div>
</template>

<style scoped></style>
