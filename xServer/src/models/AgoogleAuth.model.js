import mongoose, { Schema } from "mongoose";
import { CommonUser } from './AbaseUser.model.js'

const googleSchema = new Schema({
  googleId: {
    type: String,
    required: true,
    index: true,
    sparse: true,
  },
  accessToken: {
    type: String,
    default: null,
  },
  refreshToken: {
    type: String,
    default: null,
  },
  idToken: {
    type: String,
    default: null,
  },
});

export const GoogleAuth = CommonUser.discriminator("GoogleAuth", googleSchema);