import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import { errorResponse } from '@/lib/api-helpers';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const WIJAYAPAY_CODE_MERCHANT = process.env.WIJAYAPAY_CODE_MERCHANT;
const WIJAYAPAY_API_KEY = process.env.WIJAYAPAY_API_KEY;
const WIJAYAPAY_PAYMENT_CODE = process.env.WIJAYAPAY_PAYMENT_CODE || 'QRIS';
const WIJAYAPAY_CALLBACK_URL = process.env.WIJAYAPAY_CALLBACK_URL;

// Paket premium yang tersedia
const PREMIUM_PACKAGES = {
  '7days':  { days: 7,  amount: 3000,  label: '7 Hari' },
  '30days': { days: 30, amount: 15000, label: '30 Hari' },
};

// Hitung X-Signature: md5(code_merchant + api_key + ref_id)
function generateSignature(refId) {
  return crypto
    .createHash('md5')
    .update(`${WIJAYAPAY_CODE_MERCHANT}${WIJAYAPAY_API_KEY}${refId}`)
    .digest('hex');
}

// POST /api/payments/create-order
export async function POST(request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse('Unauthorized', 401);
    }
    const googleId = authHeader.split('Bearer ')[1];

    const body = await request.json().catch(() => ({}));
    const packageKey = body.package || '7days';
    const pkg = PREMIUM_PACKAGES[packageKey];
    if (!pkg) return errorResponse('Paket tidak valid', 400);

    await dbConnect();
    const user = await User.findOne({ googleId });
    if (!user) return errorResponse('User not found', 404);

    // Buat ref_id unik: PRE-<8 char googleId>-<timestamp>
    const timestamp = Date.now();
    const shortId = googleId.slice(0, 8).toUpperCase();
    const refId = `PRE-${shortId}-${timestamp}`;

    const signature = generateSignature(refId);

    // Buat transaksi via WijayaPay API
    const wpPayload = {
      code_merchant: WIJAYAPAY_CODE_MERCHANT,
      api_key: WIJAYAPAY_API_KEY,
      ref_id: refId,
      nominal: pkg.amount,
      code_payment: WIJAYAPAY_PAYMENT_CODE,
      callback_url: WIJAYAPAY_CALLBACK_URL,
      keterangan: `Premium ${pkg.label}`,
    };

    const wpRes = await fetch('https://wijayapay.com/api/transaction/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Signature': signature,
      },
      body: JSON.stringify(wpPayload),
    });

    const wpData = await wpRes.json();

    if (!wpData.success || !wpData.data) {
      console.error('[create-order] WijayaPay error:', wpData);
      return errorResponse(
        wpData.message || 'Gagal membuat transaksi pembayaran. Silakan coba lagi.',
        502
      );
    }

    const trxData = wpData.data;

    // Simpan pending order ke user
    if (!user.pendingPremiumOrders) user.pendingPremiumOrders = [];
    user.pendingPremiumOrders.push({
      orderId: refId,
      wijayapayTrxRef: trxData.trx_reference,
      days: pkg.days,
      amount: pkg.amount,
      paymentMethod: WIJAYAPAY_PAYMENT_CODE,
      createdAt: new Date(),
    });
    await user.save();

    return Response.json({
      success: true,
      data: {
        orderId: refId,
        trxReference: trxData.trx_reference,
        paymentMethod: trxData.payment_method,
        paymentName: trxData.payment_name,
        paymentImage: trxData.payment_image,
        totalBayar: trxData.total_bayar,
        totalFee: trxData.total_fee,
        expired: trxData.expired,
        // QRIS
        qrImage: trxData.qr_image || null,
        qrString: trxData.qr_string || null,
        // Virtual Account
        vaNumber: trxData.nomor_va || null,
        vaName: trxData.payment_name || null,
        // Retail
        paymentCode: trxData.pay_code || null,
        tutorialPembayaran: trxData.tutorial_pembayaran || null,
        days: pkg.days,
        label: pkg.label,
        message: `Order berhasil dibuat. Silakan bayar Rp${pkg.amount.toLocaleString('id-ID')} via ${trxData.payment_name}.`,
      },
    });
  } catch (err) {
    console.error('[create-order] error:', err);
    return errorResponse(err.message, 500);
  }
}
