import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import { errorResponse } from '@/lib/api-helpers';

export const dynamic = 'force-dynamic';

const WIJAYAPAY_CODE_MERCHANT = process.env.WIJAYAPAY_CODE_MERCHANT;
const WIJAYAPAY_API_KEY = process.env.WIJAYAPAY_API_KEY;

// Rate limiter — max 1 request per 15 detik per googleId
const RATE_LIMIT_MS = 15 * 1000;
const rateLimitMap = new Map(); // googleId → lastAttemptTimestamp

// POST /api/payments/verify-premium
export async function POST(request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse('Unauthorized', 401);
    }
    const googleId = authHeader.split('Bearer ')[1];

    // ─── Rate Limit ───────────────────────────────────────────
    const tsNow = Date.now();
    const lastAttempt = rateLimitMap.get(googleId) || 0;
    const elapsed = tsNow - lastAttempt;
    if (elapsed < RATE_LIMIT_MS) {
      const waitSec = Math.ceil((RATE_LIMIT_MS - elapsed) / 1000);
      return Response.json({
        success: false,
        message: `Terlalu banyak percobaan. Coba lagi dalam ${waitSec} detik.`,
      }, { status: 429 });
    }
    rateLimitMap.set(googleId, tsNow);
    setTimeout(() => rateLimitMap.delete(googleId), RATE_LIMIT_MS * 2);
    // ─────────────────────────────────────────────────────────

    const body = await request.json().catch(() => ({}));
    const { orderId } = body; // orderId = ref_id yang kita generate saat create-order
    if (!orderId) return errorResponse('orderId diperlukan', 400);

    await dbConnect();
    const user = await User.findOne({ googleId });
    if (!user) return errorResponse('User not found', 404);

    // Cek apakah orderId ada di pendingPremiumOrders
    const pendingIndex = (user.pendingPremiumOrders || []).findIndex(
      (o) => o.orderId === orderId
    );
    if (pendingIndex === -1) {
      return errorResponse('Order tidak ditemukan. Pastikan orderId sudah benar.', 404);
    }

    const pendingOrder = user.pendingPremiumOrders[pendingIndex];

    // Cek kadaluarsa 24 jam
    const pendingAgeMs = Date.now() - new Date(pendingOrder.createdAt).getTime();
    if (pendingAgeMs > 24 * 60 * 60 * 1000) {
      user.pendingPremiumOrders.splice(pendingIndex, 1);
      await user.save();
      return Response.json({
        success: false,
        message: 'Kode order sudah kadaluarsa (lebih dari 24 jam) dan dihapus. Silakan buat order baru.',
      });
    }

    // Cek status pembayaran ke WijayaPay
    const statusUrl = `https://wijayapay.com/api/get-status?code_merchant=${encodeURIComponent(WIJAYAPAY_CODE_MERCHANT)}&api_key=${encodeURIComponent(WIJAYAPAY_API_KEY)}&ref_id=${encodeURIComponent(orderId)}`;

    const wpRes = await fetch(statusUrl, { method: 'GET' });

    if (!wpRes.ok) {
      console.warn('[verify-premium] WijayaPay API unavailable, status:', wpRes.status);
      return Response.json({
        success: false,
        message: 'Layanan pengecekan pembayaran sedang tidak tersedia. Silakan coba lagi nanti.',
      });
    }

    const wpData = await wpRes.json();
    const statusPembayaran = wpData?.status_pembayaran; // 'pending' | 'paid' | 'expired'
    const trxData = wpData?.data;

    if (statusPembayaran === 'expired') {
      user.pendingPremiumOrders.splice(pendingIndex, 1);
      await user.save();
      return Response.json({
        success: false,
        message: 'Transaksi sudah kadaluarsa. Silakan buat order baru.',
      });
    }

    if (statusPembayaran !== 'paid') {
      return Response.json({
        success: false,
        message: 'Pembayaran belum diterima. Pastikan Anda sudah melakukan pembayaran via QRIS.',
        status: statusPembayaran || 'unknown',
      });
    }

    // ─── Pembayaran berhasil (paid) ──────────────────────────

    // Cek double-claim menggunakan trx_reference
    const trxRef = trxData?.trx_reference || pendingOrder.wijayapayTrxRef;
    if (trxRef) {
      const isUsed = await User.findOne({ usedWijayapayOrders: trxRef }, '_id');
      if (isUsed) {
        return Response.json({
          success: false,
          message: 'Transaksi ini sudah pernah diklaim sebelumnya.',
        });
      }
    }

    // Aktifkan premium
    const now = new Date();
    const daysMs = pendingOrder.days * 24 * 60 * 60 * 1000;

    let newPremiumUntil;
    if (user.isPremium && user.premiumUntil && user.premiumUntil > now) {
      newPremiumUntil = new Date(user.premiumUntil.getTime() + daysMs);
    } else {
      newPremiumUntil = new Date(now.getTime() + daysMs);
    }

    if (!user.isPremium) user.premiumAt = now;
    user.isPremium = true;
    user.premiumUntil = newPremiumUntil;

    // Hapus dari pending orders
    user.pendingPremiumOrders.splice(pendingIndex, 1);

    // Tandai trx_reference sebagai sudah diklaim
    if (!user.usedWijayapayOrders) user.usedWijayapayOrders = [];
    if (trxRef) user.usedWijayapayOrders.push(trxRef);

    // Kirim notifikasi ke user
    if (!user.notifications) user.notifications = [];
    user.notifications.push({
      title: '🎉 Premium Berhasil Diaktifkan!',
      message: `Pembayaran Rp${pendingOrder.amount.toLocaleString('id-ID')} via ${pendingOrder.paymentMethod || 'QRIS'} berhasil dikonfirmasi. Premium kamu aktif hingga ${newPremiumUntil.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}.`,
      isRead: false,
      createdAt: new Date(),
    });

    await user.save();

    console.log(`[verify-premium] Premium activated for user ${googleId}, order ${orderId}`);

    return Response.json({
      success: true,
      message: `Pembayaran berhasil dikonfirmasi! 🚀 Premium aktif selama ${pendingOrder.days} hari.`,
      data: {
        premiumUntil: user.premiumUntil,
        days: pendingOrder.days,
      },
    });
  } catch (err) {
    console.error('[verify-premium] error:', err);
    return errorResponse(err.message, 500);
  }
}
