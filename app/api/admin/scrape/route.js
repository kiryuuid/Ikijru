import dbConnect from '@/lib/mongodb';
import Manga from '@/lib/models/Manga';
import Chapter from '@/lib/models/Chapter';
import { successResponse, errorResponse } from '@/lib/api-helpers';

async function isAdmin(request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false;

  const tokenUid = authHeader.split('Bearer ')[1];
  const ADMIN_UIDS = (process.env.NEXT_PUBLIC_ADMIN_UIDS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  return ADMIN_UIDS.includes(tokenUid);
}

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// Helper: Scrape manga info and chapter links
async function scrapeMangaDetails(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT },
  });

  if (!res.ok) {
    throw new Error(`Gagal membuka halaman komik (HTTP ${res.status})`);
  }

  const html = await res.text();

  // 1. Judul
  const titleMatch =
    html.match(/<h1[^>]*itemprop="name"[^>]*>([\s\S]*?)<\/h1>/i) ||
    html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : '';

  // 2. Slug
  let slug = '';
  try {
    const urlObj = new URL(url);
    const parts = urlObj.pathname.split('/').filter(Boolean);
    slug = parts[parts.length - 1] || '';
  } catch (e) {
    slug = '';
  }
  if (!slug && title) {
    slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }

  // 3. Thumbnail
  const ogImgMatch = html.match(/<meta property="og:image" content="([^"]+)"/i);
  const thumbImgMatch = html.match(
    /<div class="thumb"[^>]*>[\s\S]*?<img[^>]+src="([^">]+)"/i
  );
  const thumb = (
    ogImgMatch ? ogImgMatch[1] : thumbImgMatch ? thumbImgMatch[1] : ''
  ).trim();

  // 4. Sinopsis
  const synMatch = html.match(
    /<div class="entry-content entry-content-single"[^>]*>([\s\S]*?)<\/div>/i
  );
  const synopsis = synMatch ? synMatch[1].replace(/<[^>]+>/g, '').trim() : '';

  // 5. Metadata fields (tsu-info-row atau standar mangareader)
  const getInfoValue = (label) => {
    const reg = new RegExp(
      `<span class="tsu-info-label"[^>]*>${label}<\\/span>\\s*<span class="tsu-info-value[^"]*"[^>]*>([\\s\\S]*?)<\\/span>`,
      'i'
    );
    const m = html.match(reg);
    return m ? m[1].replace(/<[^>]+>/g, '').trim() : '';
  };

  const rawType = getInfoValue('Type').toLowerCase();
  let type = 'manga';
  if (rawType.includes('manhwa')) type = 'manhwa';
  else if (rawType.includes('doujin')) type = 'doujinshi';
  else if (rawType.includes('manga')) type = 'manga';

  const rawStatus = getInfoValue('Status').toLowerCase();
  let status = 'Publishing';
  if (rawStatus.includes('finish') || rawStatus.includes('complete')) status = 'Finished';
  else if (rawStatus.includes('publish') || rawStatus.includes('ongoi')) status = 'Publishing';

  const author = getInfoValue('Author') || '';
  const alternativeTitle = getInfoValue('Alternative') || '';
  const series = getInfoValue('Serialization') || '';

  // Rating
  const scoreMatch = html.match(/<div class="score">([\d.]+)<\/div>/i);
  const rating = scoreMatch ? scoreMatch[1].trim() : '0';

  // Created / Year
  const dateMatch = html.match(/<meta itemprop="datePublished" content="([^"]+)"/i);
  let created = '';
  if (dateMatch) {
    const yr = new Date(dateMatch[1]).getFullYear();
    if (yr) created = String(yr);
  }

  // 6. Genres / Tags
  const tags = [];
  const genresBlock = html.match(/<div class="tsu-genres">([\s\S]*?)<\/div>/i);
  if (genresBlock) {
    const aMatches = genresBlock[1].matchAll(/<a[^>]*>([\s\S]*?)<\/a>/gi);
    for (const am of aMatches) {
      const g = am[1].replace(/<[^>]+>/g, '').trim();
      if (g && !tags.includes(g)) tags.push(g);
    }
  }

  // 7. Chapters List
  const chapters = [];
  const chBlock =
    html.match(/<div id="chapterlist"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/i) ||
    html.match(/<ul class="clstyle">([\s\S]*?)<\/ul>/i);
  if (chBlock) {
    const liMatches = chBlock[0].matchAll(
      /<li[^>]*data-num="([^"]*)"[^>]*>([\s\S]*?<a[^>]+href="([^"]+)"[^>]*>[\s\S]*?<span class="tsu-chaptitle">([\s\S]*?)<\/span>[\s\S]*?)<\/li>/gi
    );
    for (const lm of liMatches) {
      const numRaw = lm[1];
      const fullLi = lm[2];
      const link = lm[3];
      const rawTitle = lm[4].replace(/<[^>]+>/g, '').trim();

      // 1. Ekstraksi Nomor Chapter
      let chapterNumStr = '';
      const badgeMatch = fullLi.match(/class="tsu-chnum-badge"[^>]*>\s*<span>\s*([\d.]+)/i);
      if (badgeMatch) {
        chapterNumStr = badgeMatch[1];
      }
      if (!chapterNumStr && numRaw && !isNaN(parseFloat(numRaw))) {
        chapterNumStr = numRaw.trim();
      }
      if (!chapterNumStr) {
        const m = rawTitle.match(/chapter\s*([\d.]+)/i);
        if (m) chapterNumStr = m[1];
      }
      if (!chapterNumStr) {
        const m = link.match(/chapter-([\d.]+)/i);
        if (m) chapterNumStr = m[1];
      }

      const parsedNum = parseFloat(chapterNumStr) || 0;

      // 2. Format Judul Chapter -> "Chapter 1"
      let formattedTitle = '';
      if (/prolog/i.test(rawTitle) && (!chapterNumStr || chapterNumStr === '0')) {
        formattedTitle = 'Prologue';
      } else if (chapterNumStr) {
        formattedTitle = `Chapter ${chapterNumStr}`;
      } else {
        formattedTitle = rawTitle;
      }

      // 3. Format Slug URL -> Berdasarkan link asli doujindesu (contoh: obasan-no-seikyouiku-chapter-seikyouiku-chapter-1 atau pet-beastman-chapter-1)
      let linkSlug = '';
      try {
        const chUrl = new URL(link);
        const pParts = chUrl.pathname.split('/').filter(Boolean);
        linkSlug = pParts[pParts.length - 1] || '';
      } catch (e) {
        linkSlug = '';
      }

      const targetEnd = `chapter-${chapterNumStr || parsedNum}`.toLowerCase();
      let formattedSlug = linkSlug.toLowerCase();
      if (!formattedSlug) {
        formattedSlug = `${slug}-${targetEnd}`;
      } else if (!formattedSlug.endsWith(targetEnd)) {
        formattedSlug = `${formattedSlug}-${targetEnd}`;
      }
      formattedSlug = formattedSlug
        .replace(/[^a-z0-9.-]+/g, '-')
        .replace(/(^-|-$)+/g, '');

      chapters.push({
        title: formattedTitle,
        slug: formattedSlug,
        chapter_index: parsedNum,
        link: link,
      });
    }
  }

  // Sort chapters dari index terkecil ke terbesar agar urut saat disimpan
  chapters.sort((a, b) => a.chapter_index - b.chapter_index);

  return {
    title,
    alternativeTitle,
    slug,
    thumb,
    synopsis,
    metadata: {
      status,
      type,
      series,
      author,
      rating,
      created,
    },
    tags: tags.join(', '),
    chapters,
  };
}

// Helper: Scrape chapter images from chapter link
async function scrapeChapterImages(chapterUrl) {
  const res = await fetch(chapterUrl, {
    headers: { 'User-Agent': USER_AGENT },
  });

  if (!res.ok) {
    throw new Error(`Gagal membuka chapter: HTTP ${res.status}`);
  }

  const html = await res.text();
  const scriptMatch = html.match(/ts_reader\.run\(([\s\S]*?)\);/i);
  if (scriptMatch) {
    try {
      const data = JSON.parse(scriptMatch[1]);
      const imgs = data.sources?.[0]?.images || [];
      if (imgs.length > 0) return imgs;
    } catch (e) {}
  }

  // Fallback: cek tag img di #readerarea
  const readerArea = html.match(/<div id="readerarea"[^>]*>([\s\S]*?)<\/div>/i);
  if (readerArea) {
    const imgMatches = readerArea[1].matchAll(/<img[^>]+(?:src|data-src)="([^">]+)"/gi);
    const imgs = [];
    for (const m of imgMatches) {
      if (m[1] && !imgs.includes(m[1])) imgs.push(m[1]);
    }
    if (imgs.length > 0) return imgs;
  }

  return [];
}

export async function POST(request) {
  try {
    if (!(await isAdmin(request))) {
      return errorResponse('Forbidden', 403);
    }

    const body = await request.json();
    const { action = 'manga', url, manga_id, chapter } = body;

    // 1. Scrape Info Manga & Daftar Chapter
    if (action === 'manga') {
      if (!url) {
        return errorResponse('URL Doujindesu wajib diisi', 400);
      }

      const scrapedData = await scrapeMangaDetails(url);
      return successResponse(scrapedData);
    }

    // 2. Scrape Gambar Satu Chapter
    if (action === 'chapter-images') {
      if (!url) {
        return errorResponse('URL Chapter wajib diisi', 400);
      }

      const images = await scrapeChapterImages(url);
      return successResponse({ images });
    }

    // 3. Scrape & Simpan Langsung Chapter ke Database
    if (action === 'import-chapter') {
      if (!manga_id || !chapter || !chapter.link) {
        return errorResponse('Data chapter dan manga_id tidak lengkap', 400);
      }

      await dbConnect();

      // Ambil gambar dari halaman chapter
      const images = await scrapeChapterImages(chapter.link);

      // Simpan / update chapter
      const updatedChapter = await Chapter.findOneAndUpdate(
        { manga_id, slug: chapter.slug },
        {
          $set: {
            manga_id,
            title: chapter.title,
            slug: chapter.slug,
            chapter_index: chapter.chapter_index,
            images,
            link: chapter.link,
          },
        },
        { upsert: true, new: true }
      );

      // Update updatedAt pada Manga
      await Manga.findByIdAndUpdate(manga_id, { updatedAt: new Date() });

      return successResponse({
        chapter: updatedChapter,
        imagesCount: images.length,
      });
    }

    return errorResponse('Action tidak dikenali', 400);
  } catch (err) {
    return errorResponse(err.message, 500);
  }
}
