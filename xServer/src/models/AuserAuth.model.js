import mongoose,{Schema} from 'mongoose'
import bcrypt from 'bcrypt'
import {CommonUser} from './AbaseUser.model.js'

const userSchema = new Schema({
  username:{
    type: String,
  },
  password:{
    type: String,
    required: true,
  },
})

// userSchema.pre("save", async function () {
//   if (!this.isModified("password")) return;
//   this.password = await bcrypt.hash(this.password, 10);
// });


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