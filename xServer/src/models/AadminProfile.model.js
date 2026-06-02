import mongoose,{Schema} from 'mongoose'

const adminProfileSchema = new Schema({
    userId: {
      type: Schema.Types.ObjectId,
      ref:"CommonUser",
    },
    bio:{
        type:String
    },
  }, { timestamps: true });
  
  export const adminProfile = mongoose.model("adminProfile", adminProfileSchema);