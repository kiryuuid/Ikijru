// GET /api/payments/packages
// Mengembalikan daftar paket premium yang tersedia

export const dynamic = 'force-dynamic';

const PREMIUM_PACKAGES = [
  {
    id: '7days',
    days: 7,
    amount: 3000,
    label: '7 Hari',
    description: 'QRIS / VA / Retail (Rp 3.000)',
  },
  {
    id: '30days',
    days: 30,
    amount: 15000,
    label: '30 Hari',
    description: 'QRIS / VA / Retail (Rp 15.000)',
  },
];

export async function GET() {
  return Response.json({
    success: true,
    data: PREMIUM_PACKAGES,
  });
}
