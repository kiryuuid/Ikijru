import mongoose from 'mongoose';

const MangaSchema = new mongoose.Schema({
  title: { type: String, required: true },
  alternativeTitle: String,
  slug: { type: String, required: true, unique: true, index: true },
  thumb: String,
  synopsis: String,
  views: { type: Number, default: 0 },
  parody: String,
  character: String,
  datePublished: Date,
  metadata: {
    status: String,
    type: { type: String },
    series: String,
    author: String,
    rating: String,
    created: String,
    parody: String,
    character: String,
    datePublished: String,
    dateModified: String,
  },
  tags: [String],
}, { timestamps: true });

// --- Indexes ---
// Sort by latest / oldest
MangaSchema.index({ updatedAt: -1 });
// Sort by popularity (trending)
MangaSchema.index({ views: -1 });
// Filter by type + sort (home page & filter API)
MangaSchema.index({ 'metadata.type': 1, updatedAt: -1 });
// Filter by status + sort
MangaSchema.index({ 'metadata.status': 1, updatedAt: -1 });
// Filter by genre (tags) + sort
MangaSchema.index({ tags: 1, updatedAt: -1 });
// Full-text search on title (replaces $regex)
MangaSchema.index({ title: 'text', alternativeTitle: 'text' });

export default mongoose.models.Manga || mongoose.model('Manga', MangaSchema);
