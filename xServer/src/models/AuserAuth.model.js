import mongoose,{Schema} from 'mongoose'
import bcrypt from 'bcrypt'
import {CommonUser} from './AbaseUser.model.js'

const userSchema = new Schema({
  password:{
    type: String,
    required: true,
  },
})

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});


userSchema.methods.comparePassword = async function (plain) {
  return bcrypt.compare(plain, this.password);
};

// Never return password in JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};



// Discriminator for User model
export const SimpleUserAuth = CommonUser.discriminator(
  "SimpleUserAuth",
  userSchema
);