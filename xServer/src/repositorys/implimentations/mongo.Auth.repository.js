import { SimpleUserAuth } from "../../models/AuserAuth.model.js";
import IAuthRepository from '../contracts/IAuth.contract.js'

class AuthRepository extends IAuthRepository {

  async createUser(data){
    const newDataUser = await SimpleUserAuth.create(data);
    return newDataUser
  }

  async findUserByEmail(email) {
    return await SimpleUserAuth.findOne({ email });
  }

  async findById(userId) {
    return await SimpleUserAuth.findById(userId);
  }

  async upsertOtpUser({ email, otpCode, otpExpiresAt }) {
    return await SimpleUserAuth.findOneAndUpdate(
      { email },
      {
        $set: {
          "otp.code": otpCode,
          "otp.expiresAt": otpExpiresAt,
          isVerified: false,
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
        runValidators: false,
      }
    );
  }

  async clearOtp(userId) {
    return await SimpleUserAuth.findByIdAndUpdate(
      userId,
      {
        $set: {
          "otp.code": null,
          "otp.expiresAt": null,
        },
      },
      { new: true }
    );
  }

  async verifyUser(userId) {
    return await SimpleUserAuth.findByIdAndUpdate(
      userId,
      {
        $set: {
          isVerified: true,
          "otp.code": null,
          "otp.expiresAt": null,
        },
      },
      { new: true }
    );
  }

  async completeRegistration(userId, updateData) {
    return await SimpleUserAuth.findByIdAndUpdate(
      userId,
      {
        $set: {
          ...updateData,
          "otp.code": null,
          "otp.expiresAt": null,
        },
      },
      { new: true, runValidators: true }
    );
  }

  async saveUser(user) {
    return await user.save();
  }

  async updatePasswordByEmail(email, passwordHash) {
    return await SimpleUserAuth.findOneAndUpdate(
      { email },
      { $set: { password: passwordHash } },
      { new: true }
    );
  }
}

export default new AuthRepository();
