import BookmarkList from '@/components/BookmarkList'; // Sesuaikan path import

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Bookmark Saya',
  description: 'Daftar komik favorit yang disimpan.',
  robots: {
    index: true, // JANGAN INDEX
    follow: true, // JANGAN FOLLOW
  },
};

export default function BookmarksPage() {
  return <BookmarkList />;
}