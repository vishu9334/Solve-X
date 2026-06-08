import mongoose,{Schema} from 'mongoose'
import bcrypt from 'bcrypt'
import {CommonUser} from './AbaseUser.model.js'

const userSchema = new Schema({
  password:{
    type: String,
    required: false,
  },
  otp: {
    code: {
      type: String,
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
    }
  }
})

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});


userSchema.methods.comparePassword = async function (plain) {
  return bcrypt.compare(plain, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

export const SimpleUserAuth = CommonUser.discriminator(
  "SimpleUserAuth",
  userSchema
);