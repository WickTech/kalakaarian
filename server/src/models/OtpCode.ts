import mongoose, { Document, Schema } from 'mongoose';

interface IOtpCode extends Document {
  phone: string;
  otpHash: string;
  expiresAt: Date;
  attempts: number;
}

const OtpSchema = new Schema<IOtpCode>({
  phone: { type: String, required: true, index: true },
  otpHash: { type: String, required: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
  attempts: { type: Number, default: 0 },
});

export default mongoose.model<IOtpCode>('OtpCode', OtpSchema);
