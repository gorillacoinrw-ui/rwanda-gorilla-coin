export type Language = "rw" | "en" | "fr";

const translations: Record<Language, Record<string, string>> = {
  rw: {
    // Nav
    "nav.home": "Ahabanza",
    "nav.mine": "Gucukura",
    "nav.trade": "Guhana",
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
  },
  en: {
    "nav.home": "Home",
    "nav.mine": "Mine",
    "nav.trade": "Trade",
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
  },
  fr: {
    "nav.home": "Accueil",
    "nav.mine": "Miner",
    "nav.trade": "Échanger",
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
