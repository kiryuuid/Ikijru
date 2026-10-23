import mongoose from 'mongoose';

const appVersionSchema = new mongoose.Schema({
  versionName: { type: String, required: true },   // e.g. "2.0.0"
  versionCode: { type: Number, required: true },   // e.g. 200 (for comparison)
  changelog: { type: String, default: '' },        // markdown / plain text
  forceUpdate: { type: Boolean, default: false },  // cannot dismiss if true
  downloadUrl: { type: String, default: 'https://play.google.com/store' },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.models.AppVersion ||
  mongoose.model('AppVersion', appVersionSchema);
