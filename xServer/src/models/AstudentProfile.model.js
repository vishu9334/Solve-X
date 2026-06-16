import mongoose,{Schema} from 'mongoose'
const studentProfileSchema = new Schema({
    userId: {
      type: Schema.Types.ObjectId,
      unique: true,
      ref:"CommonUser"
    },
    bio: String,
    subscriptionStatus: {
      type: String,
      enum: ["active", "inactive"],
      default: "inactive",
    },
    subscriptionExpiresAt: {
      type: Date,
      default: null,
    },
  }, { timestamps: true });
  
  export const StudentProfile = mongoose.model("StudentProfile", studentProfileSchema);


  // express-slow-down