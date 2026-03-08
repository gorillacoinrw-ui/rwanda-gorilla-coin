export type Language = "rw" | "en" | "fr";

const translations: Record<Language, Record<string, string>> = {
  rw: {
    // Nav
    "nav.home": "Ahabanza",
    "nav.mine": "Gucukura",
    "nav.trade": "Guhana",
    "nav.history": "Amateka",
    "nav.chat": "AI",
    "nav.profile": "Umwirondoro",

    // Index
    "app.title": "GORILLA COIN",
    "app.subtitle": "Igihembo cy'Ikoranabuhanga cy'u Rwanda",
    "stats.users": "Abakoresha",
    "stats.value": "Agaciro",
    "stats.mined": "Byacukuwe",

    // Mining
    "mining.title": "Tangira Gucukura",
    "mining.button": "Tangira Gucukura",
    "mining.active": "Gucukura...",
    "mining.complete": "Byarangiye! Kanda hano",
    "mining.claim": "Yakira Amafaranga",

    // Referral
    "referral.title": "Tumira & Uhembwe",
    "referral.desc": "Uhembwa {{coins}} coins ku muntu wese utumiye!",
    "referral.joined": "inshuti zinjiye",
    "referral.earned": "coins zahembwe",
    "referral.copy": "Gukoporora Ubutumire",

    // Social
    "social.whatsapp": "WhatsApp",
    "social.facebook": "Facebook",
    "social.instagram": "Instagram",
    "social.more": "Ibindi",

    // Profile
    "profile.title": "Umwirondoro",
    "profile.edit": "Hindura Umwirondoro",
    "profile.security": "Umutekano & 2FA",
    "profile.language": "Ururimi",
    "profile.settings": "Igenamiterere",
    "profile.support": "Ubufasha",
    "profile.signout": "Sohoka",
    "profile.coins": "Coins",
    "profile.referrals": "Abatumiwe",
    "profile.mined": "Byacukuwe",
    "profile.save": "Bika",
    "profile.displayName": "Izina",
    "profile.phone": "Telefoni",
    "profile.newPassword": "Ijambo ry'ibanga rishya",
    "profile.confirmPassword": "Emeza ijambo ry'ibanga",
    "profile.updatePassword": "Hindura Ijambo ry'ibanga",
    "profile.email": "Imeli",
    "profile.referralCode": "Kode y'ubutumire",
    "profile.memberSince": "Iyandikwa",

    // Tasks
    "tasks.title": "Ibikoresho & Ihembo",
    "tasks.subtitle": "Kora ibikoresho uhembwe coins!",
    "tasks.progress": "Aho ugeze",
    "tasks.earned": "Wahembwe",
    "tasks.followTitle": "Kurikira & Kwiyandikisha",
    "tasks.shareTitle": "Sangira & Uhembwe",
    "nav.tasks": "Ibikoresho",

    // Trade
    "trade.title": "Isoko rya P2P",
    "trade.create": "Kora Itangaza",
    "trade.orders": "Amatangaza",
    "trade.myTrades": "Ibicuruzwa Byanjye",
    "trade.sell": "Gucuruza",
    "trade.buy": "Kugura",
    "trade.amount": "Ingano",
    "trade.price": "Igiciro (RWF)",
    "trade.min": "Ntoya",
    "trade.max": "Nini",
    "trade.payment": "Ubwishyu",
    "trade.escrow": "Igihe gisigaye",
    "trade.confirm": "Emeza",
    "trade.cancel": "Hagarika",

    // History
    "history.title": "Amateka y'Ibikorwa",
    "history.mining": "Gucukura",
    "history.trades": "Ibicuruzwa",
    "history.loading": "Gutegereza...",
    "history.noMining": "Nta gucukura byabayeho",
    "history.noTrades": "Nta bicuruzwa byabayeho",
    "history.inProgress": "Biracyakora...",

    "app.about": "Ibyerekeye Gorilla Coin",
    "app.hide": "Hisha",
    "app.description": "Murakaza neza kuri Gorilla Coin — urubuga rwa mbere rw'igihembo cy'ikoranabuhanga mu Rwanda rugengwa n'abaturage. Cukura coins buri munsi, guhana neza n'abandi bakoresha ukoresheje mobile money, kandi wongere umutungo wawe binyuze mu butumire. Rwubatswe n'Abanyarwanda, ku Banyarwanda, Gorilla Coin iguha amahirwe yo guhemba, guhana, no gushora mu buryo bwizewe. Kora ibikoresho kugira ngo wongere inyungu zawe, kurikirana amateka y'ibyo wacukuye, kandi winjire mu muryango w'abahanga mu ikoranabuhanga ugenda ukura. Tangira gucukura uyu munsi kandi ube igice cy'impinduka z'ubukungu bw'ikoranabuhanga mu Rwanda. 🦍",
  },
  en: {
    "nav.home": "Home",
    "nav.mine": "Mine",
    "nav.trade": "Trade",
    "nav.history": "History",
    "nav.profile": "Profile",

    "app.title": "GORILLA COIN",
    "app.subtitle": "Rwanda's Digital Reward",
    "stats.users": "Users",
    "stats.value": "Value",
    "stats.mined": "Mined",

    "mining.title": "Start Mining",
    "mining.button": "Start Mining",
    "mining.active": "Mining...",
    "mining.complete": "Complete! Tap to claim",
    "mining.claim": "Claim Coins",

    "referral.title": "Invite & Earn",
    "referral.desc": "Earn {{coins}} coins for each friend who joins!",
    "referral.joined": "friends joined",
    "referral.earned": "coins earned",
    "referral.copy": "Copy Invite Link",

    "social.whatsapp": "WhatsApp",
    "social.facebook": "Facebook",
    "social.instagram": "Instagram",
    "social.more": "More",

    "profile.title": "Profile",
    "profile.edit": "Edit Profile",
    "profile.security": "Security & 2FA",
    "profile.language": "Language",
    "profile.settings": "Settings",
    "profile.support": "Customer Support",
    "profile.signout": "Sign Out",
    "profile.coins": "Coins",
    "profile.referrals": "Referrals",
    "profile.mined": "Mined",
    "profile.save": "Save",
    "profile.displayName": "Display Name",
    "profile.phone": "Phone",
    "profile.newPassword": "New Password",
    "profile.confirmPassword": "Confirm Password",
    "profile.updatePassword": "Update Password",
    "profile.email": "Email",
    "profile.referralCode": "Referral Code",
    "profile.memberSince": "Member Since",

    // Tasks
    "tasks.title": "Tasks & Rewards",
    "tasks.subtitle": "Complete tasks to earn free coins!",
    "tasks.progress": "Progress",
    "tasks.earned": "Earned",
    "tasks.followTitle": "Follow & Subscribe",
    "tasks.shareTitle": "Share & Earn",
    "nav.tasks": "Tasks",

    "trade.title": "P2P Marketplace",
    "trade.create": "Create Order",
    "trade.orders": "Order Book",
    "trade.myTrades": "My Trades",
    "trade.sell": "Sell",
    "trade.buy": "Buy",
    "trade.amount": "Amount",
    "trade.price": "Price (RWF)",
    "trade.min": "Min",
    "trade.max": "Max",
    "trade.payment": "Payment",
    "trade.escrow": "Time left",
    "trade.confirm": "Confirm",
    "trade.cancel": "Cancel",

    "history.title": "Activity History",
    "history.mining": "Mining",
    "history.trades": "Trades",
    "history.loading": "Loading...",
    "history.noMining": "No mining sessions yet",
    "history.noTrades": "No trades yet",
    "history.inProgress": "In progress...",

    "app.about": "About Gorilla Coin",
    "app.hide": "Hide",
    "app.description": "Welcome to Gorilla Coin — Rwanda's first community-driven digital reward platform. Mine coins daily, trade securely with fellow members using mobile money, and grow your balance through referrals. Built for Rwandans, by Rwandans, Gorilla Coin empowers you to earn, trade, and invest in a transparent ecosystem. Complete social tasks to boost your earnings, track your mining history, and join a growing community of digital pioneers. Start mining today and be part of Rwanda's digital economy revolution. Your journey to financial freedom begins here — one coin at a time. 🦍",
  },
  fr: {
    "nav.home": "Accueil",
    "nav.mine": "Miner",
    "nav.trade": "Échanger",
    "nav.history": "Historique",
    "nav.profile": "Profil",

    "app.title": "GORILLA COIN",
    "app.subtitle": "Récompense Numérique du Rwanda",
    "stats.users": "Utilisateurs",
    "stats.value": "Valeur",
    "stats.mined": "Miné",

    "mining.title": "Commencer le Minage",
    "mining.button": "Commencer",
    "mining.active": "Minage...",
    "mining.complete": "Terminé ! Réclamez",
    "mining.claim": "Réclamer les Coins",

    "referral.title": "Inviter & Gagner",
    "referral.desc": "Gagnez {{coins}} coins pour chaque ami qui rejoint !",
    "referral.joined": "amis inscrits",
    "referral.earned": "coins gagnés",
    "referral.copy": "Copier le Lien",

    "social.whatsapp": "WhatsApp",
    "social.facebook": "Facebook",
    "social.instagram": "Instagram",
    "social.more": "Plus",

    "profile.title": "Profil",
    "profile.edit": "Modifier le Profil",
    "profile.security": "Sécurité & 2FA",
    "profile.language": "Langue",
    "profile.settings": "Paramètres",
    "profile.support": "Support Client",
    "profile.signout": "Déconnexion",
    "profile.coins": "Coins",
    "profile.referrals": "Parrainages",
    "profile.mined": "Miné",
    "profile.save": "Enregistrer",
    "profile.displayName": "Nom d'affichage",
    "profile.phone": "Téléphone",
    "profile.newPassword": "Nouveau mot de passe",
    "profile.confirmPassword": "Confirmer le mot de passe",
    "profile.updatePassword": "Mettre à jour",
    "profile.email": "Email",
    "profile.referralCode": "Code de Parrainage",
    "profile.memberSince": "Membre depuis",

    // Tasks
    "tasks.title": "Tâches & Récompenses",
    "tasks.subtitle": "Complétez des tâches pour gagner des coins !",
    "tasks.progress": "Progrès",
    "tasks.earned": "Gagné",
    "tasks.followTitle": "Suivre & S'abonner",
    "tasks.shareTitle": "Partager & Gagner",
    "nav.tasks": "Tâches",

    "trade.title": "Marché P2P",
    "trade.create": "Créer un Ordre",
    "trade.orders": "Carnet d'Ordres",
    "trade.myTrades": "Mes Échanges",
    "trade.sell": "Vendre",
    "trade.buy": "Acheter",
    "trade.amount": "Montant",
    "trade.price": "Prix (RWF)",
    "trade.min": "Min",
    "trade.max": "Max",
    "trade.payment": "Paiement",
    "trade.escrow": "Temps restant",
    "trade.confirm": "Confirmer",
    "trade.cancel": "Annuler",

    "history.title": "Historique des Activités",
    "history.mining": "Minage",
    "history.trades": "Échanges",
    "history.loading": "Chargement...",
    "history.noMining": "Aucune session de minage",
    "history.noTrades": "Aucun échange",
    "history.inProgress": "En cours...",

    "app.about": "À propos de Gorilla Coin",
    "app.hide": "Masquer",
    "app.description": "Bienvenue sur Gorilla Coin — la première plateforme communautaire de récompenses numériques au Rwanda. Minez des coins chaque jour, échangez en toute sécurité avec d'autres membres via mobile money, et augmentez votre solde grâce aux parrainages. Conçu par et pour les Rwandais, Gorilla Coin vous permet de gagner, échanger et investir dans un écosystème transparent. Complétez des tâches sociales, suivez votre historique de minage et rejoignez une communauté grandissante de pionniers numériques. Commencez à miner aujourd'hui et faites partie de la révolution numérique du Rwanda. 🦍",
  },
};

export function t(key: string, lang: Language = "rw", vars?: Record<string, string | number>): string {
  let text = translations[lang]?.[key] ?? translations["en"]?.[key] ?? key;
  if (vars) {
    Object.entries(vars).forEach(([k, v]) => {
      text = text.replace(`{{${k}}}`, String(v));
    });
  }
  return text;
}

export default translations;
