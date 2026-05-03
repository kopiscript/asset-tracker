/**
 * lib/translations.ts
 * All UI text in English (en) and Bahasa Malaysia (bm).
 *
 * HOW TO USE:
 *   import { t } from "@/lib/translations"
 *   const lang = "en" // or "bm"
 *   <button>{t[lang].addVehicle}</button>
 *
 * ✏️ EDIT: Add more keys here if you add more UI text.
 */

export const t = {
  en: {
    // Navigation
    dashboard: "Dashboard",
    vehicles: "Vehicles",
    settings: "Settings",
    signOut: "Sign Out",

    // Vehicle actions
    addVehicle: "Add Vehicle",
    editVehicle: "Edit Vehicle",
    deleteVehicle: "Delete Vehicle",
    shareVehicle: "Share",
    viewOnMap: "View on Map",
    viewDetails: "View Details",

    // Vehicle fields
    name: "Name",
    plateNumber: "Plate Number",
    type: "Type",
    status: "Status",
    fuelLevel: "Fuel Level",
    mileage: "Mileage",
    driverName: "Driver",
    lastSeen: "Last Seen",
    notes: "Notes",
    location: "Location",

    // Status labels
    statusActive: "Active",
    statusIdle: "Idle",
    statusOffline: "Offline",

    // Vehicle types
    car: "Car",
    van: "Van",
    truck: "Truck",
    motorcycle: "Motorcycle",
    bus: "Bus",

    // Roles
    owner: "Owner",
    editor: "Editor",
    viewer: "Viewer",

    // Common
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    loading: "Loading...",
    noData: "No data",
    noVehicles: "No vehicles yet",
    noDriver: "No driver assigned",
    noLocation: "No location data yet",
    kmAgo: "km",
    ago: "ago",
    search: "Search",
    invite: "Invite",
    remove: "Remove",
    changeRole: "Change Role",
    accessControl: "Access Control",
    shareWith: "Share with someone",
    emailAddress: "Email address",
    selectRole: "Select role",
    manageAccess: "Manage Access",
    currentAccess: "Current Access",

    // Forms
    formNamePlaceholder: "e.g. Company Van 01",
    formPlatePlaceholder: "e.g. WXY 1234",
    formDriverPlaceholder: "e.g. Ahmad bin Ali",
    formNotesPlaceholder: "Optional notes about this vehicle",

    // Landing page
    heroTitle: "Track Your Fleet,",
    heroTitleAccent: "Anywhere in Malaysia",
    heroSubtitle:
      "Real-time GPS tracking, fuel monitoring, and access control for your entire vehicle fleet — free to start.",
    getStarted: "Get Started Free",
    learnMore: "Learn More",
    featuresTitle: "Everything you need to manage your fleet",
    feature1Title: "Real-Time Tracking",
    feature1Desc:
      "See exactly where each vehicle is on a live map, updated as location data arrives.",
    feature2Title: "Access Control",
    feature2Desc:
      "Share vehicles with drivers and managers. Choose viewer, editor, or owner roles.",
    feature3Title: "Vehicle Health",
    feature3Desc:
      "Monitor fuel levels, mileage, and driver assignments from one dashboard.",
    feature4Title: "Malaysian-First",
    feature4Desc: "Built for Malaysian roads with full Bahasa Malaysia support.",
    ctaTitle: "Ready to take control of your fleet?",
    ctaSubtitle: "Sign up in seconds — no credit card required.",

    // Settings
    settingsTitle: "Account Settings",
    language: "Language",
    appearance: "Appearance",
    notifications: "Notifications",
    profile: "Profile",
  },

  bm: {
    // Navigation
    dashboard: "Papan Pemuka",
    vehicles: "Kenderaan",
    settings: "Tetapan",
    signOut: "Log Keluar",

    // Vehicle actions
    addVehicle: "Tambah Kenderaan",
    editVehicle: "Edit Kenderaan",
    deleteVehicle: "Padam Kenderaan",
    shareVehicle: "Kongsi",
    viewOnMap: "Lihat di Peta",
    viewDetails: "Lihat Butiran",

    // Vehicle fields
    name: "Nama",
    plateNumber: "No. Plat",
    type: "Jenis",
    status: "Status",
    fuelLevel: "Tahap Bahan Api",
    mileage: "Jarak Tempuh",
    driverName: "Pemandu",
    lastSeen: "Kali Terakhir Dilihat",
    notes: "Nota",
    location: "Lokasi",

    // Status labels
    statusActive: "Aktif",
    statusIdle: "Melahu",
    statusOffline: "Luar Talian",

    // Vehicle types
    car: "Kereta",
    van: "Van",
    truck: "Lori",
    motorcycle: "Motosikal",
    bus: "Bas",

    // Roles
    owner: "Pemilik",
    editor: "Penyunting",
    viewer: "Penonton",

    // Common
    save: "Simpan",
    cancel: "Batal",
    delete: "Padam",
    loading: "Memuatkan...",
    noData: "Tiada data",
    noVehicles: "Tiada kenderaan lagi",
    noDriver: "Tiada pemandu ditetapkan",
    noLocation: "Tiada data lokasi lagi",
    kmAgo: "km",
    ago: "yang lalu",
    search: "Cari",
    invite: "Jemput",
    remove: "Buang",
    changeRole: "Tukar Peranan",
    accessControl: "Kawalan Akses",
    shareWith: "Kongsi dengan seseorang",
    emailAddress: "Alamat e-mel",
    selectRole: "Pilih peranan",
    manageAccess: "Urus Akses",
    currentAccess: "Akses Semasa",

    // Forms
    formNamePlaceholder: "cth. Van Syarikat 01",
    formPlatePlaceholder: "cth. WXY 1234",
    formDriverPlaceholder: "cth. Ahmad bin Ali",
    formNotesPlaceholder: "Nota pilihan tentang kenderaan ini",

    // Landing page
    heroTitle: "Jejak Kenderaan Anda,",
    heroTitleAccent: "Di Mana Sahaja di Malaysia",
    heroSubtitle:
      "Penjejakan GPS masa nyata, pemantauan bahan api, dan kawalan akses untuk seluruh fleet kenderaan anda — percuma untuk bermula.",
    getStarted: "Mula Percuma",
    learnMore: "Ketahui Lagi",
    featuresTitle: "Semua yang anda perlukan untuk mengurus fleet anda",
    feature1Title: "Penjejakan Masa Nyata",
    feature1Desc:
      "Lihat lokasi tepat setiap kenderaan pada peta langsung, dikemas kini apabila data lokasi tiba.",
    feature2Title: "Kawalan Akses",
    feature2Desc:
      "Kongsi kenderaan dengan pemandu dan pengurus. Pilih peranan penonton, penyunting, atau pemilik.",
    feature3Title: "Kesihatan Kenderaan",
    feature3Desc:
      "Pantau tahap bahan api, jarak tempuh, dan tugasan pemandu dari satu papan pemuka.",
    feature4Title: "Utamakan Malaysia",
    feature4Desc:
      "Dibina untuk jalan Malaysia dengan sokongan penuh Bahasa Malaysia.",
    ctaTitle: "Bersedia untuk mengawal fleet anda?",
    ctaSubtitle: "Daftar dalam beberapa saat — tiada kad kredit diperlukan.",

    // Settings
    settingsTitle: "Tetapan Akaun",
    language: "Bahasa",
    appearance: "Penampilan",
    notifications: "Pemberitahuan",
    profile: "Profil",
  },
} as const;

export type Lang = keyof typeof t;
export type TranslationKey = keyof (typeof t)["en"];
