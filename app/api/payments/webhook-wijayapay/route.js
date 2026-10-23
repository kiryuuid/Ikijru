import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';

export const dynamic = 'force-dynamic';

// POST /api/payments/webhook-wijayapay
// WijayaPay akan POST ke endpoint ini ketika status pembayaran berubah menjadi "paid"
export async function POST(request) {
  try {
    // 1. Parse body callback dari WijayaPay
    const body = await request.json().catch(() => ({}));

    console.log('[webhook-wijayapay] Incoming callback:', JSON.stringify(body));

    // Field dari WijayaPay callback:
    // body.ref_id            → ref_id yang kita kirim saat create transaksi
    // body.trx_reference     → ID transaksi dari WijayaPay
    // body.status_pembayaran → 'paid' | 'pending' | 'expired'
    // body.total_bayar       → nominal yang dibayar (integer)
    // body.payment_method    → 'QRIS', 'BCAVA', dst

    const refId = body.ref_id;
    const trxReference = body.trx_reference;
    const statusPembayaran = body.status_pembayaran;
    const totalBayar = parseInt(body.total_bayar, 10) || 0;

    // Hanya proses callback "paid"
    if (!refId || statusPembayaran !== 'paid') {
      return Response.json({
        success: true,
        message: `Callback received, status: ${statusPembayaran || 'unknown'} — not processed`,
      });
    }

    await dbConnect();

    // 2. Cari user yang memiliki pending order dengan ref_id ini
    const user = await User.findOne({
      'pendingPremiumOrders.orderId': refId,
    });

    if (!user) {
      console.warn(`[webhook-wijayapay] ref_id ${refId} not found in any pending orders.`);
      return Response.json({
        success: true,
        message: `ref_id ${refId} not found or already processed.`,
      });
    }

    const pendingIndex = user.pendingPremiumOrders.findIndex((o) => o.orderId === refId);
    if (pendingIndex === -1) {
      return Response.json({ success: true, message: `ref_id ${refId} not found.` });
    }

    const pendingOrder = user.pendingPremiumOrders[pendingIndex];

    // 3. Cek kadaluarsa 24 jam (safety check)
    const pendingAgeMs = Date.now() - new Date(pendingOrder.createdAt).getTime();
    if (pendingAgeMs > 24 * 60 * 60 * 1000) {
      user.pendingPremiumOrders.splice(pendingIndex, 1);
      await user.save();
      return Response.json({ success: true, message: 'Order expired, removed.' });
    }

    // 4. Anti-replay: cek apakah trx_reference sudah pernah diklaim
    if (trxReference) {
      const isUsed = await User.findOne({ usedWijayapayOrders: trxReference }, '_id');
      if (isUsed) {
        console.warn(`[webhook-wijayapay] Duplicate trx_reference: ${trxReference}`);
        return Response.json({ success: true, message: 'Transaction already claimed.' });
      }
    }

    // 5. Verifikasi jumlah bayar (toleransi: bayar >= tagihan)
    if (totalBayar > 0 && totalBayar < pendingOrder.amount) {
      console.warn(`[webhook-wijayapay] Underpaid: Expected ${pendingOrder.amount}, Got ${totalBayar}`);
      return Response.json({ success: true, message: 'Amount insufficient, order not fulfilled.' });
    }

    // 6. Aktifkan premium
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

    // Simpan trx_reference sebagai sudah diklaim
    if (!user.usedWijayapayOrders) user.usedWijayapayOrders = [];
    if (trxReference) user.usedWijayapayOrders.push(trxReference);

    // Kirim notifikasi In-App ke user
    if (!user.notifications) user.notifications = [];
    user.notifications.push({
      title: '✅ Premium Otomatis Aktif!',
      message: `Kami telah menerima pembayaran sebesar Rp${totalBayar.toLocaleString('id-ID')} via ${body.payment_method || 'WijayaPay'}. Premium kamu kini aktif hingga ${newPremiumUntil.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}.`,
      isRead: false,
      createdAt: new Date(),
    });

    await user.save();

    console.log(`[webhook-wijayapay] Premium activated for order ${refId} (trx: ${trxReference})`);

    return Response.json({ success: true, message: 'Premium activated successfully.' });

  } catch (err) {
    console.error('[webhook-wijayapay] error:', err);
    // Return 500 agar WijayaPay tahu ada error dan bisa retry
    return Response.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
