import { NextResponse } from 'next/server';

// POST /api/verify-captcha — verifikasi Cloudflare Turnstile token
export async function POST(request) {
  try {
    let token = null;

    try {
      const body = await request.json();
      token = body?.token;
    } catch {
      console.error('Invalid JSON body');
    }

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Token tidak ditemukan' },
        { status: 400 }
      );
    }

    const secretKey = process.env.TURNSTILE_SECRET_KEY;

    if (!secretKey) {
      console.error('TURNSTILE_SECRET_KEY is not defined in environment variables.');
      return NextResponse.json(
        { success: false, message: 'Konfigurasi server error' },
        { status: 500 }
      );
    }

    // Verifikasi ke Cloudflare Turnstile
    const formData = new FormData();
    formData.append('secret', secretKey);
    formData.append('response', token);

    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (data.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: 'Verifikasi keamanan gagal. Silakan coba lagi.',
          errors: data['error-codes'],
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Turnstile verification error:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan saat memverifikasi' },
      { status: 500 }
    );
  }
}
