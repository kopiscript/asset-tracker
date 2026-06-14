export const t = {
  en: {
    // Navigation
    dashboard: "Dashboard",
    vehicles: "Vehicles",
    organisations: "Organisations",
    settings: "Settings",
    signOut: "Sign Out",
    fleetOverview: "Fleet Overview",
    adminPanel: "Admin Panel",

    // Vehicle actions
    addVehicle: "Add Vehicle",
    editVehicle: "Edit Vehicle",
    deleteVehicle: "Delete Vehicle",
    shareVehicle: "Share",
    viewOnMap: "View on Map",
    viewDetails: "View Details",
    newOrg: "New Org",

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
    imei: "IMEI",

    // Stat card labels
    statTotal: "Total",
    statUsers: "Users",

    // Status labels
    statusActive: "Active",
    statusIdle: "Idle",
    statusOffline: "Offline",
    allStatuses: "All Statuses",

    // Vehicle types
    car: "Car",
    van: "Van",
    truck: "Truck",
    motorcycle: "Motorcycle",
    bus: "Bus",

    // Roles
    owner: "Owner",
    admin: "Admin",
    editor: "Editor",
    viewer: "Viewer",

    // Common
    save: "Save",
    add: "Add",
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
    members: "Members",

    // Search & filters
    searchPlaceholder: "Search by name, plate, or driver…",
    noVehiclesMatch: "No vehicles match your search.",

    // Vehicle detail
    vehicleInfo: "Vehicle Info",
    additionalInfo: "Additional Info",
    currentSpeed: "Current Speed",
    todayMileage: "Today's Mileage",
    organisation: "Organisation",
    yourRole: "Your Role",
    coordinates: "Coordinates",
    overview: "Overview",
    noGpsYet: "No GPS location recorded yet. Map is centred on Kuala Lumpur.",

    // Admin table columns
    colVehicle: "Vehicle",
    colOrg: "Org",
    colSpeed: "Speed",
    colManage: "Manage",
    colUser: "User",
    colRole: "Role",
    colOrgs: "Orgs",
    colJoined: "Joined",

    // Fallbacks & empties
    never: "Never",
    configure: "Configure →",
    noneAssigned: "None",
    noVehiclesInSystem: "No vehicles in system.",
    noOrgsInSystem: "No organisations in system.",
    noUsersInSystem: "No users in system.",
    noVehiclesDesc: "Add your first GPS device to start tracking your fleet on the live map.",

    // Dashboard
    inYourOrgs: "in your organisations",
    viewAll: "View all",
    addOneArrow: "Add one →",

    // Settings
    profileSubtitle: "Your account information.",
    noNameSet: "No name set",
    languageSubtitle: "Choose the display language for the dashboard.",
    support: "Support",
    needHelpContact: "Need help? Contact us at",

    // Admin
    globalOverview: "Global fleet overview — all users and vehicles",
    allVehicles: "All Vehicles",
    allOrganisations: "All Organisations",
    allUsers: "All Users",

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

    // Org detail
    you: "(you)",
    noMembers: "No members yet.",
    removeConfirm: "Remove {name} from this organisation?",
    failedRemove: "Failed to remove member.",
    vehicleAccess: "Vehicle Access",
    viewerAccessHint: "Check the vehicles this viewer can access. Check all to grant full access.",
    vehiclesSelected: "vehicles selected",
    noRestriction: "Full access — sees all vehicles",
    accessAll: "All",
    noVehiclesSelected: "Select at least one vehicle.",
    of: "of",
    failedSaveAccess: "Failed to save vehicle access.",
    pendingInvites: "Pending Invites",
    revokeInvite: "Revoke invite",
    revokeConfirm: "Revoke invite for {email}?",
    failedRevoke: "Failed to revoke invite.",
    failedChangeRole: "Failed to change role.",
    expires: "Expires",

    // Settings
    settingsSubtitle: "Manage your account and preferences.",
    settingsTitle: "Account Settings",
    language: "Language",
    appearance: "Appearance",
    notifications: "Notifications",
    profile: "Profile",

    // Trip history
    tripHistory: "History",
    loadTrips: "Load Trips",
    tripsFound: "trips",
    pointsFound: "points",
    tripLabel: "Trip",
    tripListHeader: "Trips — click a row to show route",
    noTripsFound: "No trips found for this time range.",
    fromLabel: "From (MY time)",
    toLabel: "To (MY time)",
    durationMin: "min",
    distanceKm: "km",
    errorMaxWindow: "Maximum history window is 30 days.",
    errorToBeforeFrom: "'To' must be after 'From'.",
    historyModeAll: "All data",
    historyModeTrips: "Trips",
    historyAllLabel: "All activity",
    historyAllListHeader: "All recorded positions — full path on map",
    positionsFound: "positions",
    noHistoryFound: "No data found for this time range.",
    loadBtn: "Load",

    // Live status / telemetry
    liveStatus: "Live Status",
    carBattery: "Car Battery",
    deviceBattery: "Device Battery",
    movementState: "Movement",
    movingState: "Driving",
    parkedState: "Parked",
    gpsSignal: "GPS Signal",
    cellSignal: "Cell Signal",
    headingLabel: "Heading",
    altitudeLabel: "Altitude",
    carrierLabel: "Carrier",
    satellitesLabel: "satellites",
    batteryCharging: "Engine on",
    batteryHealthy: "Healthy",
    batteryLow: "Low",
    batteryCritical: "Critical",
    batteryUnknown: "No reading",
    gpsStrong: "Strong",
    gpsGood: "Good",
    gpsWeak: "Weak",
    gpsNone: "No fix",
    sigExcellent: "Excellent",
    sigGood: "Good",
    sigFair: "Fair",
    sigPoor: "Poor",
    sigNone: "No signal",
    batteryAlertTitle: "Battery attention needed",
    batteryAlertDesc: "These vehicles may need charging soon:",

    // Onboarding
    welcomeTitle: "Welcome",
    welcomeSubtitleViewer: "You can track all vehicles in real time on the live map.",
    welcomeSubtitleAdmin: "You can view vehicle details and edit vehicle information.",
    goToFleet: "Go to your fleet",
    setupYourFleet: "Set up your fleet",
    renameYourFleet: "Name your fleet",
    addFirstVehicle: "Add your first vehicle",
    inviteYourTeam: "Invite your team",
    skipForNow: "Skip for now",
    setupComplete: "You're all set",

    // Invite page
    inviteJoinAs: "You've been invited to join",
    inviteRole: "as a",
    inviteAccept: "Accept & Join",
    inviteExpired: "This invite link has expired.",
    inviteExpiredHint: "Ask {name} to send you a new invite.",
    inviteAlreadyJoined: "You've already joined this fleet.",
    inviteWrongAccount: "This invite is for {email}. Sign out to use a different account.",
    inviteCreateAccount: "Create account to join",

    // Landing
    landingInviteNote: "Joining someone else's fleet? You'll receive an invite link from your fleet owner — no sign-up needed here.",
    landingTeamTitle: "Built for your whole team",
    landingTeamSubtitle: "Invite your whole team — each person sees exactly what they need, nothing more.",
    landingOwnerTitle: "Owner",
    landingOwnerDesc: "Sets up the fleet, manages billing, and has full control over vehicles and team.",
    landingAdminTitle: "Admin",
    landingAdminDesc: "Views and edits vehicle details, driver info, and trip history.",
    landingViewerTitle: "Viewer",
    landingViewerDesc: "Tracks vehicles live on the map with read-only access.",
  },

  bm: {
    // Navigation
    dashboard: "Papan Pemuka",
    vehicles: "Kenderaan",
    organisations: "Organisasi",
    settings: "Tetapan",
    signOut: "Log Keluar",
    fleetOverview: "Gambaran Fleet",
    adminPanel: "Panel Pentadbir",

    // Vehicle actions
    addVehicle: "Tambah Kenderaan",
    editVehicle: "Edit Kenderaan",
    deleteVehicle: "Padam Kenderaan",
    shareVehicle: "Kongsi",
    viewOnMap: "Lihat di Peta",
    viewDetails: "Lihat Butiran",
    newOrg: "Org Baru",

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
    imei: "IMEI",

    // Stat card labels
    statTotal: "Jumlah",
    statUsers: "Pengguna",

    // Status labels
    statusActive: "Aktif",
    statusIdle: "Melahu",
    statusOffline: "Luar Talian",
    allStatuses: "Semua Status",

    // Vehicle types
    car: "Kereta",
    van: "Van",
    truck: "Lori",
    motorcycle: "Motosikal",
    bus: "Bas",

    // Roles
    owner: "Pemilik",
    admin: "Admin",
    editor: "Penyunting",
    viewer: "Penonton",

    // Common
    save: "Simpan",
    add: "Tambah",
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
    members: "Ahli",

    // Search & filters
    searchPlaceholder: "Cari nama, plat, atau pemandu…",
    noVehiclesMatch: "Tiada kenderaan yang sepadan dengan carian anda.",

    // Vehicle detail
    vehicleInfo: "Maklumat Kenderaan",
    additionalInfo: "Maklumat Tambahan",
    currentSpeed: "Kecepatan Semasa",
    todayMileage: "Jarak Hari Ini",
    organisation: "Organisasi",
    yourRole: "Peranan Anda",
    coordinates: "Koordinat",
    overview: "Gambaran Keseluruhan",
    noGpsYet: "Tiada lokasi GPS direkodkan lagi. Peta dipusatkan di Kuala Lumpur.",

    // Admin table columns
    colVehicle: "Kenderaan",
    colOrg: "Org",
    colSpeed: "Kelajuan",
    colManage: "Urus",
    colUser: "Pengguna",
    colRole: "Peranan",
    colOrgs: "Org",
    colJoined: "Tarikh Daftar",

    // Fallbacks & empties
    never: "Tidak Pernah",
    configure: "Konfigurasi →",
    noneAssigned: "Tiada",
    noVehiclesInSystem: "Tiada kenderaan dalam sistem.",
    noOrgsInSystem: "Tiada organisasi dalam sistem.",
    noUsersInSystem: "Tiada pengguna dalam sistem.",
    noVehiclesDesc: "Tambah peranti GPS pertama anda untuk mula menjejak fleet anda di peta langsung.",

    // Dashboard
    inYourOrgs: "dalam organisasi anda",
    viewAll: "Lihat semua",
    addOneArrow: "Tambah →",

    // Settings
    profileSubtitle: "Maklumat akaun anda.",
    noNameSet: "Nama belum ditetapkan",
    languageSubtitle: "Pilih bahasa paparan untuk papan pemuka.",
    support: "Sokongan",
    needHelpContact: "Perlukan bantuan? Hubungi kami di",

    // Admin
    globalOverview: "Gambaran fleet global — semua pengguna dan kenderaan",
    allVehicles: "Semua Kenderaan",
    allOrganisations: "Semua Organisasi",
    allUsers: "Semua Pengguna",

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

    // Org detail
    you: "(anda)",
    noMembers: "Tiada ahli lagi.",
    removeConfirm: "Buang {name} daripada organisasi ini?",
    failedRemove: "Gagal membuang ahli.",
    vehicleAccess: "Akses Kenderaan",
    viewerAccessHint: "Tandakan kenderaan yang penonton ini boleh akses. Tandakan semua untuk akses penuh.",
    vehiclesSelected: "kenderaan dipilih",
    noRestriction: "Akses penuh — nampak semua kenderaan",
    accessAll: "Semua",
    noVehiclesSelected: "Pilih sekurang-kurangnya satu kenderaan.",
    of: "daripada",
    failedSaveAccess: "Gagal simpan akses kenderaan.",
    pendingInvites: "Jemputan Tertunda",
    revokeInvite: "Batalkan jemputan",
    revokeConfirm: "Batalkan jemputan untuk {email}?",
    failedRevoke: "Gagal membatalkan jemputan.",
    failedChangeRole: "Gagal menukar peranan.",
    expires: "Tamat",

    // Settings
    settingsSubtitle: "Urus akaun dan keutamaan anda.",
    settingsTitle: "Tetapan Akaun",
    language: "Bahasa",
    appearance: "Penampilan",
    notifications: "Pemberitahuan",
    profile: "Profil",

    // Trip history
    tripHistory: "Sejarah",
    loadTrips: "Muat Perjalanan",
    tripsFound: "perjalanan",
    pointsFound: "titik",
    tripLabel: "Perjalanan",
    tripListHeader: "Perjalanan — klik baris untuk tunjuk laluan",
    noTripsFound: "Tiada perjalanan dijumpai untuk julat masa ini.",
    fromLabel: "Dari (waktu MY)",
    toLabel: "Ke (waktu MY)",
    durationMin: "min",
    distanceKm: "km",
    errorMaxWindow: "Tetingkap sejarah maksimum ialah 30 hari.",
    errorToBeforeFrom: "'Ke' mesti selepas 'Dari'.",
    historyModeAll: "Semua Data",
    historyModeTrips: "Perjalanan",
    historyAllLabel: "Semua aktiviti",
    historyAllListHeader: "Semua kedudukan direkod — laluan penuh di peta",
    positionsFound: "kedudukan",
    noHistoryFound: "Tiada data untuk julat masa ini.",
    loadBtn: "Muat",

    // Live status / telemetry
    liveStatus: "Status Langsung",
    carBattery: "Bateri Kereta",
    deviceBattery: "Bateri Peranti",
    movementState: "Pergerakan",
    movingState: "Memandu",
    parkedState: "Diletak",
    gpsSignal: "Isyarat GPS",
    cellSignal: "Isyarat Selular",
    headingLabel: "Arah",
    altitudeLabel: "Altitud",
    carrierLabel: "Pembawa",
    satellitesLabel: "satelit",
    batteryCharging: "Enjin hidup",
    batteryHealthy: "Sihat",
    batteryLow: "Lemah",
    batteryCritical: "Kritikal",
    batteryUnknown: "Tiada bacaan",
    gpsStrong: "Kuat",
    gpsGood: "Baik",
    gpsWeak: "Lemah",
    gpsNone: "Tiada isyarat",
    sigExcellent: "Cemerlang",
    sigGood: "Baik",
    sigFair: "Sederhana",
    sigPoor: "Lemah",
    sigNone: "Tiada isyarat",
    batteryAlertTitle: "Bateri perlu perhatian",
    batteryAlertDesc: "Kenderaan ini mungkin perlu dicas tidak lama lagi:",

    // Onboarding
    welcomeTitle: "Selamat datang",
    welcomeSubtitleViewer: "Anda boleh menjejaki semua kenderaan secara langsung di peta.",
    welcomeSubtitleAdmin: "Anda boleh melihat butiran kenderaan dan mengemas kini maklumat kenderaan.",
    goToFleet: "Pergi ke armada anda",
    setupYourFleet: "Sediakan armada anda",
    renameYourFleet: "Namakan armada anda",
    addFirstVehicle: "Tambah kenderaan pertama anda",
    inviteYourTeam: "Jemput pasukan anda",
    skipForNow: "Langkau buat masa ini",
    setupComplete: "Anda sudah sedia",

    // Invite page
    inviteJoinAs: "Anda telah dijemput untuk menyertai",
    inviteRole: "sebagai",
    inviteAccept: "Terima & Sertai",
    inviteExpired: "Pautan jemputan ini telah tamat tempoh.",
    inviteExpiredHint: "Minta {name} menghantar jemputan baharu kepada anda.",
    inviteAlreadyJoined: "Anda telah pun menyertai armada ini.",
    inviteWrongAccount: "Jemputan ini untuk {email}. Log keluar untuk menggunakan akaun lain.",
    inviteCreateAccount: "Cipta akaun untuk menyertai",

    // Landing
    landingInviteNote: "Menyertai armada orang lain? Anda akan menerima pautan jemputan daripada pemilik armada anda — tidak perlu mendaftar di sini.",
    landingTeamTitle: "Dibina untuk seluruh pasukan anda",
    landingTeamSubtitle: "Jemput seluruh pasukan anda — setiap orang melihat tepat apa yang mereka perlukan, tidak lebih.",
    landingOwnerTitle: "Pemilik",
    landingOwnerDesc: "Menyediakan armada, menguruskan pengebilan, dan mempunyai kawalan penuh ke atas kenderaan dan pasukan.",
    landingAdminTitle: "Admin",
    landingAdminDesc: "Melihat dan mengemas kini butiran kenderaan, maklumat pemandu, dan sejarah perjalanan.",
    landingViewerTitle: "Pemerhati",
    landingViewerDesc: "Menjejaki kenderaan secara langsung di peta dengan akses baca sahaja.",
  },
} as const;

export type Lang = keyof typeof t;
export type TranslationKey = keyof (typeof t)["en"];
