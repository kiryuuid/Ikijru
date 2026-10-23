import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  title: String,
  message: String,
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const historySchema = new mongoose.Schema({
  type: String,
  slug: String,
  title: String,
  thumb: String,
  lastChapterTitle: String,
  lastChapterSlug: String,
  lastRead: { type: Date, default: Date.now },
});

const librarySchema = new mongoose.Schema({
  slug: { type: String, required: true },
  mangaData: { type: mongoose.Schema.Types.Mixed },
  addedAt: { type: Date, default: Date.now },
});

const userSchema = new mongoose.Schema({
  googleId: String,
  email: String,
  password: { type: String, select: false },
  displayName: String,
  photoURL: { type: String, default: '/default-avatar.gif' },
  bio: { type: String, default: '', maxlength: 100 },
  isAdmin: { type: Boolean, default: false },
  isPremium: { type: Boolean, default: false },
  premiumUntil: { type: Date, default: null },
  premiumAt: { type: Date, default: null },
  dailyDownloads: {
    date: { type: String, default: '' },
    count: { type: Number, default: 0 },
  },
  downloadCount: { type: Number, default: 0 },
  lastDownloadDate: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now, index: true },
  notifications: [notificationSchema],
  history: [historySchema],
  library: [librarySchema],
  hasUsedTrial: { type: Boolean, default: false },
  trialClaimIp: { type: String, default: null },
  // Pending WijayaPay premium payments awaiting payment confirmation
  pendingPremiumOrders: [{
    orderId: { type: String, required: true },       // ref_id kita (unik)
    wijayapayTrxRef: { type: String, default: null }, // trx_reference dari WijayaPay
    days: { type: Number, default: 7 },
    amount: { type: Number, default: 3000 },
    paymentMethod: { type: String, default: 'QRIS' },
    createdAt: { type: Date, default: Date.now },
  }],
  // trx_reference WijayaPay yang sudah berhasil diklaim (anti-double claim)
  usedWijayapayOrders: [{ type: String }],
  // Dipakai untuk hapus otomatis akun yang tidak login dalam periode tertentu.
  lastLoginAt: { type: Date, default: Date.now, index: true },
});

// --- Indexes ---
// Primary lookup: hampir semua user API lookup by googleId
userSchema.index({ googleId: 1 }, { unique: true, sparse: true });
// Fallback lookup saat migrasi (sync by email)
userSchema.index({ email: 1 }, { sparse: true });
// Filter premium users (admin stats)
userSchema.index({ isPremium: 1 });
// Filter trial users (admin stats)
userSchema.index({ hasUsedTrial: 1 });
// Webhook lookup by pending order ID
userSchema.index({ 'pendingPremiumOrders.orderId': 1 });

// Hapus cached model agar Next.js hot-reload selalu pakai schema terbaru
if (mongoose.models.User) {
  delete mongoose.models.User;
}

export default mongoose.model('User', userSchema);
