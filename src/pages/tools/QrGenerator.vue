<script setup>
import { ref, reactive, computed, onMounted, watch } from "vue";
import QRCodeStyling from "qr-code-styling";

const qrContainer = ref(null);

// ── 0. BẢN PREVIEW (CỐ ĐỊNH 256PX CHO TỐC ĐỘ SIÊU NHANH) ──────────────────────
// Khởi tạo bản xem trước nhỏ gọn, mượt mà trên màn hình
const qrCode = new QRCodeStyling({
    width: 256,
    height: 256,
    type: 'svg', // Dùng SVG giúp 256px không bị vỡ hạt khi zoom
    data: " ",
    image: "",
    dotsOptions: { color: "#ec13ec", type: "square" },
    backgroundOptions: { color: "#ffffff" },
});

// ── 1. Tab / output settings ─────────────────────────────────────────────────
const selectedType = ref("text");
const errorCorrection = ref("M");
const resolution = ref(1024);
const downloadFormat = ref("png");

const sizes = [256, 512, 1024, 2048];
const formats = ["png", "jpeg", "webp", "svg"];
const encryptions = ["None", "WEP", "WPA/WPA2"];
const errorLevels = ["L", "M", "Q", "H"];

const types = [
    { id: "text", name: "Text", icon: "notes" },
    { id: "url", name: "URL", icon: "link" },
    { id: "wifi", name: "WiFi", icon: "wifi" },
    { id: "vcard", name: "VCard", icon: "contact_page" },
    { id: "email", name: "Email", icon: "mail" },
    { id: "phone", name: "Phone", icon: "call" },
    { id: "sms", name: "SMS", icon: "sms" },
];

// ── 2. Form data (NEVER persisted) ───────────────────────────────────────────
const formData = reactive({
    text: "",
    url: "",
    wifi: { ssid: "", encryption: "None", password: "", hidden: false },
    vcard: { firstName: "", lastName: "", phone: "", email: "", organization: "", title: "", website: "" },
    email: { address: "", subject: "", body: "" },
    phone: { number: "" },
    sms: { number: "", message: "" },
});

// ── 3. Design state (persisted) ──────────────────────────────────────────────
const DESIGN_STORAGE_KEY = "lamduck-qr-design";

const design = reactive({
    dotsColor: "#ec13ec",
    backgroundColor: "#ffffff",
    isBgTransparent: false,
    cornersSquareColor: "#000000",
    cornersDotColor: "#000000",
    logoImage: null,
    logoMargin: 5,
    imageSize: 0.3,
    hideBgBehindLogo: true,
    dotsType: "square",
    cornersSquareType: "square",
    cornersDotType: "square",
});

const dotTypes = ["square", "dots", "rounded", "extra-rounded", "classy", "classy-rounded"];
const cornerSquareTypes = ["square", "dot", "extra-rounded"];
const cornerDotTypes = ["square", "dot"];

// ── 4. Computed helpers ──────────────────────────────────────────────────────
const isValidUrl = computed(() => {
    if (!formData.url) return true;
    return /^https?:\/\/.+/.test(formData.url);
});

const isContentEmpty = computed(() => {
    switch (selectedType.value) {
        case "text": return !formData.text.trim();
        case "url": return !formData.url.trim() || !isValidUrl.value;
        case "wifi": return !formData.wifi.ssid.trim();
        case "vcard": return !formData.vcard.firstName.trim() && !formData.vcard.lastName.trim();
        case "email": return !formData.email.address.trim();
        case "phone": return !formData.phone.number.trim();
        case "sms": return !formData.sms.number.trim();
        default: return true;
    }
});

const showLogoEcWarning = computed(() => !!design.logoImage && errorCorrection.value !== "H");

const isDesignOpen = ref(false);
const activeAccordion = ref("colors");
const toggleAccordion = (acc) => {
    activeAccordion.value = activeAccordion.value === acc ? "" : acc;
};

// ── 6. Logo upload ───────────────────────────────────────────────────────────
const fileInput = ref(null);

const triggerFileUpload = () => fileInput.value?.click();

const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
        alert("Please upload a valid image file (PNG, JPG, SVG, etc.).");
        return;
    }

    if (design.logoImage) {
        URL.revokeObjectURL(design.logoImage);
    }
    design.logoImage = URL.createObjectURL(file);
};

const removeLogo = () => {
    if (design.logoImage) {
        URL.revokeObjectURL(design.logoImage);
    }
    design.logoImage = null;
    if (fileInput.value) fileInput.value.value = "";
};

// ── 7. QR Core Builder ───────────────────────────────────────────────────────
let debounceTimer = null;

const buildContent = () => {
    switch (selectedType.value) {
        case "text": return formData.text;
        case "url": return formData.url;
        case "wifi": {
            if (!formData.wifi.ssid) return "";
            const { ssid, encryption, password, hidden } = formData.wifi;
            const encTag = encryption === "None" ? "nopass" : encryption;
            const passSegment = encryption !== "None" ? `P:${password};` : "";
            const hiddenSegment = hidden ? "H:true;" : "";
            return `WIFI:T:${encTag};S:${ssid};${passSegment}${hiddenSegment};`;
        }
        case "vcard": {
            const { firstName, lastName, phone, email, organization, title, website } = formData.vcard;
            const fnSafe = firstName || "";
            const lnSafe = lastName || "";

            if (!fnSafe.trim() && !lnSafe.trim()) return "";

            const fn = [fnSafe, lnSafe].filter(Boolean).map(s => s.trim()).join(" ");
            let card = `BEGIN:VCARD\nVERSION:3.0\nN:${lnSafe.trim()};${fnSafe.trim()}\nFN:${fn}`;
            if (phone?.trim()) card += `\nTEL:${phone.trim()}`;
            if (email?.trim()) card += `\nEMAIL:${email.trim()}`;
            if (organization?.trim()) card += `\nORG:${organization.trim()}`;
            if (title?.trim()) card += `\nTITLE:${title.trim()}`;
            if (website?.trim()) card += `\nURL:${website.trim()}`;
            card += `\nEND:VCARD`;
            return card;
        }
        case "email": {
            if (!formData.email.address) return "";
            const { address, subject, body } = formData.email;
            return `mailto:${address}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        }
        case "phone": return formData.phone.number ? `tel:${formData.phone.number}` : "";
        case "sms": return formData.sms.number ? `SMSTO:${formData.sms.number}:${formData.sms.message}` : "";
        default: return "";
    }
};

// Hàm gói cấu hình (Dùng chung)
const getQrOptions = (targetSize) => {
    return {
        width: targetSize,
        height: targetSize,
        margin: Math.floor(targetSize * 0.05),
        data: buildContent() || " ", // Giữ khoảng trắng để tránh lỗi null
        qrOptions: { errorCorrectionLevel: errorCorrection.value },
        dotsOptions: { color: design.dotsColor, type: design.dotsType },
        backgroundOptions: { color: design.isBgTransparent ? "rgba(0,0,0,0)" : design.backgroundColor },
        cornersSquareOptions: { color: design.cornersSquareColor, type: design.cornersSquareType },
        cornersDotOptions: { color: design.cornersDotColor, type: design.cornersDotType },
        image: design.logoImage || "",
        imageOptions: {
            hideBackgroundDots: design.hideBgBehindLogo,
            imageSize: design.imageSize,
            margin: design.logoMargin,
            crossOrigin: "anonymous",
        },
    };
};

const updateQRCode = () => {
    // Chỉ render 256px cho bản Preview
    qrCode.update(getQrOptions(256));
};

const debouncedUpdate = () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(updateQRCode, 300);
};

// Không theo dõi 'resolution' vì nó không làm thay đổi bản Preview
watch(
    [formData, design, selectedType, errorCorrection],
    debouncedUpdate,
    { deep: true }
);

// ── helpers ──────────────────────────────────────────────────────────────
    const getTimestamp = () => {
        const now = new Date();
        const pad = (n) => n.toString().padStart(2, '0');
        const y = now.getFullYear();
        const m = pad(now.getMonth() + 1);
        const d = pad(now.getDate());
        const hh = pad(now.getHours());
        const mm = pad(now.getMinutes());
        const ss = pad(now.getSeconds());
        return `${y}${m}${d}-${hh}${mm}${ss}`;
    };

    // thông báo tạm cho nút lịch sử
    const showHistory = () => {
        alert('Coming soon');
    };

    // ── 8. Download (Thuật toán Tạo bản sao trong RAM) ───────────────────────────
const handleDownload = () => {
    if (isContentEmpty.value) return;

    const ext = downloadFormat.value;
    const targetSize = parseInt(resolution.value);

    // Tạo bản sao vô hình với size bự (1024, 2048...)
    const exportQr = new QRCodeStyling({
        ...getQrOptions(targetSize),
        type: ext === 'svg' ? 'svg' : 'canvas' // Phân loại đúng đuôi xuất
    });

    // Lấy size thực tế và lưu
    const timestamp = getTimestamp();
    exportQr.download({
        name: `QrCode-${timestamp}`,
        extension: ext,
    });
};

// ── 9. LocalStorage ──────────────────────────────────────────────────────────
watch(design, () => {
    const toSave = { ...design, logoImage: null };
    localStorage.setItem(DESIGN_STORAGE_KEY, JSON.stringify(toSave));
}, { deep: true });

onMounted(() => {
    try {
        const saved = localStorage.getItem(DESIGN_STORAGE_KEY);
        if (saved) Object.assign(design, JSON.parse(saved));
    } catch { /* ignore */ }

    if (qrContainer.value) {
        qrCode.append(qrContainer.value);
        updateQRCode();
    }
});
</script>

<template>
    <div
        class="relative flex h-full w-full flex-col bg-background-light dark:bg-background-dark shadow-2xl overflow-hidden">
        <div
            class="flex items-center justify-between px-4 py-4 sticky top-0 z-20 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-gray-200 dark:border-[#392839] shrink-0">
            <div class="flex items-center gap-3">
                <h1 class="text-xl font-bold tracking-tight text-slate-900 dark:text-white">QR Generator</h1>
            </div>
            <button @click="showHistory" class="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                <span class="material-symbols-outlined">history</span>
            </button>
        </div>

        <div class="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden">

            <div
                class="custom-scrollbar flex-1 lg:overflow-y-auto pb-6 border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-[#392839]">
                <div
                    class="pt-6 pb-4 border-b border-gray-200 dark:border-[#392839] sticky top-0 bg-background-light dark:bg-background-dark z-10">
                    <div class="flex overflow-x-auto gap-6 px-4 pb-2 scrollbar-hide">
                        <button v-for="type in types" :key="type.id" @click="selectedType = type.id"
                            class="group flex flex-col items-center gap-2 min-w-[60px]">
                            <div v-if="selectedType === type.id"
                                class="flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-white shadow-lg shadow-primary/25 transition-transform group-active:scale-95">
                                <span class="material-symbols-outlined text-2xl">{{ type.icon }}</span>
                            </div>
                            <div v-else
                                class="flex items-center justify-center w-12 h-12 rounded-xl bg-white dark:bg-[#2e1d2e] text-slate-500 dark:text-[#b99db9] border border-gray-200 dark:border-[#392839] group-hover:border-primary/50 transition-all group-active:scale-95">
                                <span class="material-symbols-outlined text-2xl">{{ type.icon }}</span>
                            </div>
                            <span
                                :class="['text-xs', selectedType === type.id ? 'font-semibold text-primary' : 'font-medium text-slate-500 dark:text-[#b99db9]']">
                                {{ type.name }}
                            </span>
                        </button>
                    </div>
                </div>

                <div class="p-4 space-y-4">
                    <div v-if="selectedType === 'text'" class="space-y-4">
                        <div class="space-y-3">
                            <label class="text-sm font-medium text-slate-700 dark:text-[#b99db9]">Content</label>
                            <textarea v-model="formData.text"
                                class="w-full h-32 pl-4 pt-3 pr-4 rounded-xl bg-white dark:bg-[#271c27] border-gray-200 dark:border-[#543b54] text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
                                placeholder="Enter your text here..."></textarea>
                        </div>
                    </div>

                    <div v-if="selectedType === 'url'" class="space-y-4">
                        <div class="space-y-3">
                            <label class="text-sm font-medium text-slate-700 dark:text-[#b99db9]">Website URL</label>
                            <div class="relative">
                                <input v-model="formData.url"
                                    :class="['w-full h-12 pl-11 pr-4 rounded-xl bg-white dark:bg-[#271c27] text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 transition-all', !isValidUrl ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 dark:border-[#543b54] focus:ring-primary']"
                                    placeholder="https://example.com" type="url" />
                                <span class="material-symbols-outlined absolute left-3 top-3 text-slate-400">link</span>
                            </div>
                            <p v-if="!isValidUrl" class="text-xs text-red-500 mt-1">URL must start with http:// or
                                https://</p>
                        </div>
                    </div>

                    <div v-if="selectedType === 'wifi'" class="space-y-4">
                        <div class="space-y-3">
                            <label class="text-sm font-medium text-slate-700 dark:text-[#b99db9]">Network Name
                                (SSID)</label>
                            <div class="relative">
                                <input v-model="formData.wifi.ssid"
                                    class="w-full h-12 pl-11 pr-4 rounded-xl bg-white dark:bg-[#271c27] border-gray-200 dark:border-[#543b54] text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary transition-all"
                                    placeholder="MyWiFi_5G" type="text" />
                                <span class="material-symbols-outlined absolute left-3 top-3 text-slate-400">wifi</span>
                            </div>
                        </div>
                        <div class="space-y-3">
                            <label class="text-sm font-medium text-slate-700 dark:text-[#b99db9]">Encryption</label>
                            <div class="flex gap-2">
                                <button v-for="enc in encryptions" :key="enc" @click="formData.wifi.encryption = enc"
                                    :class="['flex-1 py-2 text-xs rounded-lg border transition-all', formData.wifi.encryption === enc ? 'bg-primary/10 border-primary text-primary font-bold' : 'bg-transparent border-gray-200 dark:border-[#543b54] text-slate-500 hover:border-primary/50']">
                                    {{ enc }}
                                </button>
                            </div>
                        </div>
                        <div class="space-y-3" v-if="formData.wifi.encryption !== 'None'">
                            <label class="text-sm font-medium text-slate-700 dark:text-[#b99db9]">Password</label>
                            <div class="relative">
                                <input v-model="formData.wifi.password"
                                    class="w-full h-12 pl-11 pr-4 rounded-xl bg-white dark:bg-[#271c27] border-gray-200 dark:border-[#543b54] text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary transition-all"
                                    type="password" placeholder="WiFi Password" />
                                <span class="material-symbols-outlined absolute left-3 top-3 text-slate-400">lock</span>
                            </div>
                        </div>
                        <div class="flex items-center justify-between">
                            <span class="text-sm font-medium text-slate-700 dark:text-[#b99db9]">Hidden Network</span>
                            <button role="switch" :aria-checked="formData.wifi.hidden"
                                @click="formData.wifi.hidden = !formData.wifi.hidden"
                                :class="['relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none', formData.wifi.hidden ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600']">
                                <span
                                    :class="['inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform', formData.wifi.hidden ? 'translate-x-4' : 'translate-x-1']"></span>
                            </button>
                        </div>
                    </div>

                    <div v-if="selectedType === 'vcard'" class="space-y-4">
                        <div class="grid grid-cols-2 gap-4">
                            <div class="space-y-3">
                                <label class="text-sm font-medium text-slate-700 dark:text-[#b99db9]">First Name</label>
                                <input v-model="formData.vcard.firstName"
                                    class="w-full h-12 px-4 rounded-xl bg-white dark:bg-[#271c27] border-gray-200 dark:border-[#543b54] text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary transition-all"
                                    placeholder="John" type="text" />
                            </div>
                            <div class="space-y-3">
                                <label class="text-sm font-medium text-slate-700 dark:text-[#b99db9]">Last Name</label>
                                <input v-model="formData.vcard.lastName"
                                    class="w-full h-12 px-4 rounded-xl bg-white dark:bg-[#271c27] border-gray-200 dark:border-[#543b54] text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary transition-all"
                                    placeholder="Doe" type="text" />
                            </div>
                        </div>
                        <div class="space-y-3">
                            <label class="text-sm font-medium text-slate-700 dark:text-[#b99db9]">Phone Number</label>
                            <div class="relative">
                                <input v-model="formData.vcard.phone"
                                    class="w-full h-12 pl-11 pr-4 rounded-xl bg-white dark:bg-[#271c27] border-gray-200 dark:border-[#543b54] text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary transition-all"
                                    placeholder="+1 234 567 890" type="tel" />
                                <span class="material-symbols-outlined absolute left-3 top-3 text-slate-400">call</span>
                            </div>
                        </div>
                        <div class="space-y-3">
                            <label class="text-sm font-medium text-slate-700 dark:text-[#b99db9]">Email</label>
                            <div class="relative">
                                <input v-model="formData.vcard.email"
                                    class="w-full h-12 pl-11 pr-4 rounded-xl bg-white dark:bg-[#271c27] border-gray-200 dark:border-[#543b54] text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary transition-all"
                                    placeholder="john@example.com" type="email" />
                                <span class="material-symbols-outlined absolute left-3 top-3 text-slate-400">mail</span>
                            </div>
                        </div>
                        <div class="space-y-3">
                            <label class="text-sm font-medium text-slate-700 dark:text-[#b99db9]">Organization</label>
                            <input v-model="formData.vcard.organization"
                                class="w-full h-12 px-4 rounded-xl bg-white dark:bg-[#271c27] border-gray-200 dark:border-[#543b54] text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary transition-all"
                                placeholder="Acme Corp" type="text" />
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div class="space-y-3">
                                <label class="text-sm font-medium text-slate-700 dark:text-[#b99db9]">Title /
                                    Role</label>
                                <input v-model="formData.vcard.title"
                                    class="w-full h-12 px-4 rounded-xl bg-white dark:bg-[#271c27] border-gray-200 dark:border-[#543b54] text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary transition-all"
                                    placeholder="Engineer" type="text" />
                            </div>
                            <div class="space-y-3">
                                <label class="text-sm font-medium text-slate-700 dark:text-[#b99db9]">Website</label>
                                <input v-model="formData.vcard.website"
                                    class="w-full h-12 px-4 rounded-xl bg-white dark:bg-[#271c27] border-gray-200 dark:border-[#543b54] text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary transition-all"
                                    placeholder="https://..." type="url" />
                            </div>
                        </div>
                    </div>

                    <div v-if="selectedType === 'phone'" class="space-y-4">
                        <div class="space-y-3">
                            <label class="text-sm font-medium text-slate-700 dark:text-[#b99db9]">Phone Number</label>
                            <div class="relative">
                                <input v-model="formData.phone.number"
                                    class="w-full h-12 pl-11 pr-4 rounded-xl bg-white dark:bg-[#271c27] border-gray-200 dark:border-[#543b54] text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary transition-all"
                                    placeholder="+1 234 567 890" type="tel" />
                                <span class="material-symbols-outlined absolute left-3 top-3 text-slate-400">call</span>
                            </div>
                            <p class="text-xs text-slate-400">Scanning will prompt to call this number.</p>
                        </div>
                    </div>

                    <div v-if="selectedType === 'sms'" class="space-y-4">
                        <div class="space-y-3">
                            <label class="text-sm font-medium text-slate-700 dark:text-[#b99db9]">Phone Number</label>
                            <div class="relative">
                                <input v-model="formData.sms.number"
                                    class="w-full h-12 pl-11 pr-4 rounded-xl bg-white dark:bg-[#271c27] border-gray-200 dark:border-[#543b54] text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary transition-all"
                                    placeholder="+1 234 567 890" type="tel" />
                                <span class="material-symbols-outlined absolute left-3 top-3 text-slate-400">sms</span>
                            </div>
                        </div>
                        <div class="space-y-3">
                            <label class="text-sm font-medium text-slate-700 dark:text-[#b99db9]">Pre-filled Message
                                <span class="text-slate-400">(optional)</span></label>
                            <textarea v-model="formData.sms.message"
                                class="w-full h-24 pl-4 pt-3 pr-4 rounded-xl bg-white dark:bg-[#271c27] border-gray-200 dark:border-[#543b54] text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary transition-all resize-none"
                                placeholder="Hello, I scanned your QR code!"></textarea>
                        </div>
                    </div>

                    <div v-if="selectedType === 'email'" class="space-y-4">
                        <div class="space-y-3">
                            <label class="text-sm font-medium text-slate-700 dark:text-[#b99db9]">To</label>
                            <div class="relative">
                                <input v-model="formData.email.address"
                                    class="w-full h-12 pl-11 pr-4 rounded-xl bg-white dark:bg-[#271c27] border-gray-200 dark:border-[#543b54] text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary transition-all"
                                    placeholder="recipient@example.com" type="email" />
                                <span class="material-symbols-outlined absolute left-3 top-3 text-slate-400">mail</span>
                            </div>
                        </div>
                        <div class="space-y-3">
                            <label class="text-sm font-medium text-slate-700 dark:text-[#b99db9]">Subject</label>
                            <input v-model="formData.email.subject"
                                class="w-full h-12 px-4 rounded-xl bg-white dark:bg-[#271c27] border-gray-200 dark:border-[#543b54] text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary transition-all"
                                placeholder="Email Subject" type="text" />
                        </div>
                        <div class="space-y-3">
                            <label class="text-sm font-medium text-slate-700 dark:text-[#b99db9]">Message</label>
                            <textarea v-model="formData.email.body"
                                class="w-full h-24 pl-4 pt-3 pr-4 rounded-xl bg-white dark:bg-[#271c27] border-gray-200 dark:border-[#543b54] text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary transition-all resize-none"
                                placeholder="Email message..."></textarea>
                        </div>
                    </div>
                </div>

                <hr class="border-gray-200 dark:border-[#392839] mx-4 my-4" />

                <div class="px-4 pb-6">
                    <button @click="isDesignOpen = !isDesignOpen"
                        class="flex items-center justify-between w-full p-4 rounded-xl bg-white dark:bg-[#271c27] border border-gray-200 dark:border-[#392839] hover:border-primary/50 transition-all group">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                                <span class="material-symbols-outlined text-sm">brush</span>
                            </div>
                            <span
                                class="font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">Design
                                & Customization</span>
                        </div>
                        <span class="material-symbols-outlined text-slate-400 transition-transform duration-300"
                            :class="{ 'rotate-180': isDesignOpen }">expand_more</span>
                    </button>

                    <div v-show="isDesignOpen" class="space-y-3 mt-3">
                        <div
                            class="rounded-xl bg-white dark:bg-[#271c27] border border-gray-200 dark:border-[#392839] overflow-hidden transition-all duration-300">
                            <button @click="toggleAccordion('colors')"
                                class="flex items-center justify-between w-full p-4 text-left">
                                <div class="flex items-center gap-3">
                                    <div
                                        class="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                                        <span class="material-symbols-outlined text-white text-sm">palette</span>
                                    </div>
                                    <span class="font-medium text-slate-900 dark:text-white">Colors</span>
                                </div>
                                <span class="material-symbols-outlined text-slate-400 transition-transform duration-300"
                                    :class="{ 'rotate-180': activeAccordion === 'colors' }">expand_more</span>
                            </button>

                            <div v-if="activeAccordion === 'colors'"
                                class="px-4 pb-4 pt-0 border-t border-gray-100 dark:border-[#392839] space-y-4">
                                <div class="flex items-center justify-between pt-2">
                                    <span class="text-sm font-medium text-slate-600 dark:text-[#b99db9]">Transparent
                                        Background</span>
                                    <button role="switch" :aria-checked="design.isBgTransparent"
                                        @click="design.isBgTransparent = !design.isBgTransparent"
                                        :class="['relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none', design.isBgTransparent ? 'bg-primary' : 'bg-slate-300 dark:bg-[#392839]']">
                                        <span
                                            :class="['inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform', design.isBgTransparent ? 'translate-x-4' : 'translate-x-1']"></span>
                                    </button>
                                </div>

                                <div class="grid grid-cols-2 gap-4">
                                    <div class="space-y-2">
                                        <label class="text-xs font-medium text-slate-500 dark:text-[#6e566e]">QR
                                            Dots</label>
                                        <div
                                            class="flex items-center gap-2 w-full h-10 px-2 rounded-lg bg-white dark:bg-[#2e1d2e] border border-gray-200 dark:border-[#543b54] focus-within:ring-1 focus-within:ring-primary transition-all">
                                            <div
                                                class="relative w-6 h-6 rounded border border-gray-300 dark:border-[#1f161f] overflow-hidden shrink-0 cursor-pointer shadow-sm">
                                                <input type="color" v-model="design.dotsColor"
                                                    class="absolute -top-4 -left-4 w-16 h-16 cursor-pointer" />
                                            </div>
                                            <input type="text" v-model="design.dotsColor"
                                                class="w-full bg-transparent text-xs font-bold text-slate-700 dark:text-slate-300 uppercase outline-none" />
                                        </div>
                                    </div>

                                    <div class="space-y-2"
                                        :class="{ 'opacity-50 pointer-events-none': design.isBgTransparent }">
                                        <label
                                            class="text-xs font-medium text-slate-500 dark:text-[#6e566e]">Background</label>
                                        <div
                                            class="flex items-center gap-2 w-full h-10 px-2 rounded-lg bg-white dark:bg-[#2e1d2e] border border-gray-200 dark:border-[#543b54] focus-within:ring-1 focus-within:ring-primary transition-all">
                                            <div
                                                class="relative w-6 h-6 rounded border border-gray-300 dark:border-[#1f161f] overflow-hidden shrink-0 cursor-pointer shadow-sm">
                                                <input type="color" v-model="design.backgroundColor"
                                                    class="absolute -top-4 -left-4 w-16 h-16 cursor-pointer" />
                                            </div>
                                            <input type="text" v-model="design.backgroundColor"
                                                class="w-full bg-transparent text-xs font-bold text-slate-700 dark:text-slate-300 uppercase outline-none" />
                                        </div>
                                    </div>

                                    <div class="space-y-2">
                                        <label class="text-xs font-medium text-slate-500 dark:text-[#6e566e]">Corner
                                            Frame</label>
                                        <div
                                            class="flex items-center gap-2 w-full h-10 px-2 rounded-lg bg-white dark:bg-[#2e1d2e] border border-gray-200 dark:border-[#543b54] focus-within:ring-1 focus-within:ring-primary transition-all">
                                            <div
                                                class="relative w-6 h-6 rounded border border-gray-300 dark:border-[#1f161f] overflow-hidden shrink-0 cursor-pointer shadow-sm">
                                                <input type="color" v-model="design.cornersSquareColor"
                                                    class="absolute -top-4 -left-4 w-16 h-16 cursor-pointer" />
                                            </div>
                                            <input type="text" v-model="design.cornersSquareColor"
                                                class="w-full bg-transparent text-xs font-bold text-slate-700 dark:text-slate-300 uppercase outline-none" />
                                        </div>
                                    </div>

                                    <div class="space-y-2">
                                        <label class="text-xs font-medium text-slate-500 dark:text-[#6e566e]">Corner
                                            Dot</label>
                                        <div
                                            class="flex items-center gap-2 w-full h-10 px-2 rounded-lg bg-white dark:bg-[#2e1d2e] border border-gray-200 dark:border-[#543b54] focus-within:ring-1 focus-within:ring-primary transition-all">
                                            <div
                                                class="relative w-6 h-6 rounded border border-gray-300 dark:border-[#1f161f] overflow-hidden shrink-0 cursor-pointer shadow-sm">
                                                <input type="color" v-model="design.cornersDotColor"
                                                    class="absolute -top-4 -left-4 w-16 h-16 cursor-pointer" />
                                            </div>
                                            <input type="text" v-model="design.cornersDotColor"
                                                class="w-full bg-transparent text-xs font-bold text-slate-700 dark:text-slate-300 uppercase outline-none" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div
                            class="rounded-xl bg-white dark:bg-[#271c27] border border-gray-200 dark:border-[#392839] overflow-hidden transition-all duration-300">
                            <button @click="toggleAccordion('logo')"
                                class="flex items-center justify-between w-full p-4 text-left">
                                <div class="flex items-center gap-3">
                                    <div
                                        class="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-500 flex items-center justify-center">
                                        <span class="material-symbols-outlined text-sm">image</span>
                                    </div>
                                    <span class="font-medium text-slate-900 dark:text-white">Logo</span>
                                </div>
                                <span class="material-symbols-outlined text-slate-400 transition-transform duration-300"
                                    :class="{ 'rotate-180': activeAccordion === 'logo' }">expand_more</span>
                            </button>

                            <div v-if="activeAccordion === 'logo'"
                                class="px-4 pb-4 pt-0 border-t border-gray-100 dark:border-[#392839]">
                                <input type="file" ref="fileInput" @change="handleFileUpload" accept="image/*"
                                    class="hidden" />

                                <div v-if="!design.logoImage" @click="triggerFileUpload"
                                    class="mt-3 border-2 border-dashed border-gray-300 dark:border-[#543b54] rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 dark:hover:bg-[#2e1d2e] transition-colors">
                                    <span
                                        class="material-symbols-outlined text-slate-400 text-3xl mb-2">cloud_upload</span>
                                    <span class="text-sm font-medium text-slate-600 dark:text-slate-300">Upload
                                        Image</span>
                                    <span class="text-xs text-slate-400 mt-1">PNG, JPG, SVG</span>
                                </div>

                                <div v-else
                                    class="mt-3 border border-gray-200 dark:border-[#543b54] rounded-xl p-4 flex items-center gap-4">
                                    <div
                                        class="w-16 h-16 rounded-lg bg-gray-100 dark:bg-black/50 overflow-hidden flex items-center justify-center p-1">
                                        <img :src="design.logoImage" class="max-w-full max-h-full object-contain" />
                                    </div>
                                    <div class="flex-1">
                                        <p class="text-sm font-medium dark:text-white">Logo Uploaded</p>
                                        <button @click="removeLogo"
                                            class="text-xs text-red-500 hover:underline mt-1">Remove Image</button>
                                    </div>
                                </div>

                                <div v-if="design.logoImage" class="space-y-4 mt-4">
                                    <div v-if="showLogoEcWarning"
                                        class="flex items-start gap-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 p-3">
                                        <span
                                            class="material-symbols-outlined text-yellow-500 text-[18px] shrink-0 mt-0.5">warning</span>
                                        <p class="text-xs text-yellow-700 dark:text-yellow-400">Logo reduces scan
                                            reliability. Switch Error Correction to <strong>H</strong> for best results.
                                        </p>
                                    </div>

                                    <div class="flex items-center justify-between">
                                        <span class="text-xs font-medium text-slate-500 dark:text-[#b99db9]">Hide BG
                                            Behind Logo</span>
                                        <button role="switch" :aria-checked="design.hideBgBehindLogo"
                                            @click="design.hideBgBehindLogo = !design.hideBgBehindLogo"
                                            :class="['relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none', design.hideBgBehindLogo ? 'bg-primary' : 'bg-slate-300 dark:bg-[#392839]']">
                                            <span
                                                :class="['inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform', design.hideBgBehindLogo ? 'translate-x-4' : 'translate-x-1']"></span>
                                        </button>
                                    </div>

                                    <div class="space-y-2">
                                        <div class="flex justify-between text-xs text-slate-500 dark:text-[#b99db9]">
                                            <span>Logo Margin</span>
                                            <span>{{ design.logoMargin }}px</span>
                                        </div>
                                        <input v-model="design.logoMargin" type="range" min="0" max="20"
                                            class="w-full h-1 bg-gray-200 dark:bg-[#392839] rounded-lg appearance-none cursor-pointer" />
                                    </div>

                                    <div class="space-y-2">
                                        <div class="flex justify-between text-xs text-slate-500 dark:text-[#b99db9]">
                                            <span>Logo Size</span>
                                            <span>{{ Math.round(design.imageSize * 100) }}%</span>
                                        </div>
                                        <input v-model.number="design.imageSize" type="range" min="0.1" max="0.5"
                                            step="0.01"
                                            class="w-full h-1 bg-gray-200 dark:bg-[#392839] rounded-lg appearance-none cursor-pointer" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div
                            class="rounded-xl bg-white dark:bg-[#271c27] border border-gray-200 dark:border-[#392839] overflow-hidden transition-all duration-300">
                            <button @click="toggleAccordion('shapes')"
                                class="flex items-center justify-between w-full p-4 text-left">
                                <div class="flex items-center gap-3">
                                    <div
                                        class="w-8 h-8 rounded-lg bg-green-500/20 text-green-500 flex items-center justify-center">
                                        <span class="material-symbols-outlined text-sm">shapes</span>
                                    </div>
                                    <span class="font-medium text-slate-900 dark:text-white">Pattern &amp;
                                        Corners</span>
                                </div>
                                <span class="material-symbols-outlined text-slate-400 transition-transform duration-300"
                                    :class="{ 'rotate-180': activeAccordion === 'shapes' }">expand_more</span>
                            </button>

                            <div v-if="activeAccordion === 'shapes'"
                                class="px-4 pb-4 pt-3 border-t border-gray-100 dark:border-[#392839] space-y-5">
                                <div class="space-y-2">
                                    <label class="text-xs font-medium text-slate-500 dark:text-[#b99db9]">QR Dots
                                        Pattern</label>
                                    <select v-model="design.dotsType"
                                        class="w-full h-10 px-3 rounded-lg bg-white dark:bg-[#2e1d2e] border border-gray-200 dark:border-[#543b54] text-sm text-slate-900 dark:text-white focus:ring-1 focus:ring-primary appearance-none cursor-pointer">
                                        <option v-for="type in dotTypes" :key="type" :value="type" class="capitalize">{{
                                            type }}</option>
                                    </select>
                                </div>
                                <div class="grid grid-cols-2 gap-3">
                                    <div class="space-y-2">
                                        <label class="text-xs font-medium text-slate-500 dark:text-[#b99db9]">Corner
                                            Square (Outer)</label>
                                        <select v-model="design.cornersSquareType"
                                            class="w-full h-10 px-3 rounded-lg bg-white dark:bg-[#2e1d2e] border border-gray-200 dark:border-[#543b54] text-sm text-slate-900 dark:text-white focus:ring-1 focus:ring-primary appearance-none cursor-pointer">
                                            <option v-for="type in cornerSquareTypes" :key="type" :value="type"
                                                class="capitalize">{{ type }}</option>
                                        </select>
                                    </div>
                                    <div class="space-y-2">
                                        <label class="text-xs font-medium text-slate-500 dark:text-[#b99db9]">Corner Dot
                                            (Inner)</label>
                                        <select v-model="design.cornersDotType"
                                            class="w-full h-10 px-3 rounded-lg bg-white dark:bg-[#2e1d2e] border border-gray-200 dark:border-[#543b54] text-sm text-slate-900 dark:text-white focus:ring-1 focus:ring-primary appearance-none cursor-pointer">
                                            <option v-for="type in cornerDotTypes" :key="type" :value="type"
                                                class="capitalize">{{ type }}</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div
                class="w-full lg:w-[400px] xl:w-[480px] shrink-0 bg-slate-50 dark:bg-black/10 border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-[#392839] lg:overflow-y-auto p-4 lg:p-6 pb-24 lg:pb-6 custom-scrollbar">
                <div
                    class="bg-white dark:bg-[#1f161f] rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-[#392839]">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="font-bold text-slate-900 dark:text-white">Result</h3>
                    </div>

                    <div
                        class="aspect-square w-full bg-white rounded-xl flex items-center justify-center border-4 border-dashed border-gray-200 dark:border-[#392839] mb-6 relative overflow-hidden p-2">
                        <div ref="qrContainer" id="qr-container-id"
                            class="flex items-center justify-center w-full h-full max-w-[400px] max-h-[400px]"
                            :class="{ 'opacity-10 pointer-events-none blur-sm': isContentEmpty }"></div>
                        <div v-if="isContentEmpty"
                            class="absolute inset-0 flex flex-col items-center justify-center bg-white/50 dark:bg-[#1f161f]/50 rounded-xl z-10 backdrop-blur-[2px]">
                            <span
                                class="material-symbols-outlined text-slate-400 dark:text-slate-500 text-[56px] mb-2">qr_code_scanner</span>
                            <p class="text-sm font-bold text-slate-600 dark:text-slate-300">Enter content to preview</p>
                        </div>
                    </div>

                    <div class="space-y-4 mb-5">
                        <div class="flex items-center justify-between">
                            <label class="text-xs font-medium text-slate-500 dark:text-[#b99db9]">Error
                                Correction</label>
                            <div class="flex bg-gray-100 dark:bg-[#271c27] rounded-lg p-1 gap-1">
                                <button v-for="level in errorLevels" :key="level" @click="errorCorrection = level"
                                    :class="[
                                        'px-3 py-1.5 text-xs rounded-md transition-all',
                                        errorCorrection === level
                                            ? 'bg-white dark:bg-primary text-slate-900 dark:text-white font-bold shadow-sm'
                                            : 'font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white',
                                    ]">
                                    {{ level }}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="space-y-2 mb-6">
                        <div class="flex items-center justify-between mb-2">
                            <label class="text-xs font-medium text-slate-500 dark:text-[#b99db9]">Size (Pixels)</label>
                        </div>
                        <div class="flex gap-2">
                            <button v-for="size in sizes" :key="size" @click="resolution = size" :class="[
                                'flex-1 py-2 text-xs rounded-lg border transition-all',
                                resolution === size
                                    ? 'bg-primary/10 border-primary text-primary font-bold'
                                    : 'bg-transparent border-gray-200 dark:border-[#543b54] text-slate-500 hover:border-primary/50',
                            ]">
                                {{ size }}
                            </button>
                        </div>
                    </div>

                    <div class="space-y-2 mb-6">
                        <div class="flex items-center justify-between mb-2">
                            <label class="text-xs font-medium text-slate-500 dark:text-[#b99db9]">Download as</label>
                        </div>
                        <div class="flex gap-2">
                            <button v-for="fmt in formats" :key="fmt" @click="downloadFormat = fmt" :class="[
                                'flex-1 py-2 text-xs font-bold uppercase rounded-lg border transition-all',
                                downloadFormat === fmt
                                    ? 'bg-primary/10 border-primary text-primary'
                                    : 'bg-transparent border-gray-200 dark:border-[#543b54] text-slate-500 hover:border-primary/50',
                            ]">
                                {{ fmt }}
                            </button>
                        </div>
                    </div>

                    <button @click="handleDownload" :disabled="isContentEmpty"
                        :class="['w-full flex items-center justify-center gap-2 font-bold py-3.5 rounded-xl transition-all', isContentEmpty ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed' : 'bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 active:scale-95']">
                        <span class="material-symbols-outlined text-[20px]">download</span>
                        <span>Download</span>
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    height: 16px;
    width: 16px;
    border-radius: 50%;
    background: var(--color-primary, #ec13ec);
    cursor: pointer;
    margin-top: -6px;
}

input[type="range"]::-webkit-slider-runnable-track {
    width: 100%;
    height: 4px;
    cursor: pointer;
    background: #543b54;
    border-radius: 2px;
}

/* Đảm bảo QR không tràn khung khi preview */
:deep(#qr-container-id canvas),
:deep(#qr-container-id svg) {
    width: 100% !important;
    height: 100% !important;
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
}
</style>