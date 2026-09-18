import mongoose from 'mongoose';

const translationHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    sourceLang: {
      type: String,
      required: true,
      trim: true,
    },
    targetLang: {
      type: String,
      required: true,
      trim: true,
    },
    sourceCode: {
      type: String,
      required: true,
    },
    translatedCode: {
      type: String,
      required: true,
    },
    astData: {
      type: Object,
      default: {},
    },
    testStubs: {
      type: String,
      default: '',
    },
    metrics: {
      tokensUsed: Number,
      latencyMs: Number,
      astNodesParsed: Number,
    },
    options: {
      preserveComments: Boolean,
      includeTests: Boolean,
    },
  },
  { timestamps: true }
);

export const TranslationHistory =
  mongoose.models.TranslationHistory ||
  mongoose.model('TranslationHistory', translationHistorySchema);
