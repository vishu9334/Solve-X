import mongoose, { Schema } from "mongoose";
const googleSchema = new Schema({
  name: {
    type: String,
  },
  email: {
    type: String,
    unique: true,
    required: true,
  },
  avatar: {
    type: String,
  },
  googleId: {
    type: String,
  },
  role: {
    type: Schema.Types.ObjectId,
    ref: "Role",
  },
  skillCategory:{
    type:Schema.Types.ObjectId,
    ref:"SkillsCategory"
  },
  isVerifiedUser: {
    type: Boolean,
    default: false,
  },
  isVerifiedMentor: {
    type: Boolean,
    default: false,
  },
  verificationStatus:{
    type:String,
    enum:[pendding, reject, Active]
   },

  verifiedAt:{
    type:Date,
  },
  rejectedAt:{
    type:Date,
  },
  rejectionReason:{
    type:String,
    trim:true,
    lowercase:true
  },
  totalVerificationAttempts: Number
});

export const GoogleAuth = mongoose.model("GoogleAuth", googleSchema);
