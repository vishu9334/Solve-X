import mongoose,{Schema} from 'mongoose'
const studentProfileSchema = new Schema({
    userId: {
      type: Schema.Types.ObjectId,
      ref:"CommonUser"
    },
    bio: String,
  }, { timestamps: true });
  
  export const StudentProfile = mongoose.model("StudentProfile", studentProfileSchema);


  // express-slow-down