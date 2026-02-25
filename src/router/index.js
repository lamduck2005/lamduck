import { createRouter, createWebHistory } from "vue-router";
import Home from "@/pages/Home.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "Home",
      component: Home,
      meta: {
        showInMenu: true,
        // showInHome: true,
        title: "Back to home",
        icon: "weui:back-filled",
        color: "bg-primary/10 text-primary",
      },
    },
    {
      path: "/qr-generator",
      name: "QR Code Generator",
      component: () => import("@/pages/tools/QrGenerator.vue"),
      meta: {
        showInMenu: true,
        showInHome: true,
        title: "QR Code Generator",
        description: "Create custom QR codes with logos and colors.",
        icon: "material-symbols:qr-code-2",
        color: "bg-primary/10 text-primary",
      },
    },
  ],
});

export default router;
