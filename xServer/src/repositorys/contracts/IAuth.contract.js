class IAuthRepository {
    async createUser(data) {
      throw new Error("Method 'createUser' must be implemented.");
    }
  
    async findUserByEmail(email) {
      throw new Error("Method 'findUserByEmail' must be implemented.");
    }
  
    async findById(userId) {
      throw new Error("Method 'findById' must be implemented.");
    }
  
    async upsertOtpUser({ email, otpCode, otpExpiresAt }) {
      throw new Error("Method 'upsertOtpUser' must be implemented.");
    }
  
    async clearOtp(userId) {
      throw new Error("Method 'clearOtp' must be implemented.");
    }
  
    async verifyUser(userId) {
      throw new Error("Method 'verifyUser' must be implemented.");
    }
  
    async completeRegistration(userId, updateData) {
      throw new Error("Method 'completeRegistration' must be implemented.");
    }
  
    async saveUser(user) {
      throw new Error("Method 'saveUser' must be implemented.");
    }

    async updatePasswordByEmail(email, passwordHash) {
      throw new Error("Method 'updatePasswordByEmail' must be implemented.");
    }
  }
  
  export default IAuthRepository;