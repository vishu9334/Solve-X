class IAuthRepository {
    async findUserByEmail(email) {
        throw new Error("Method 'findUserByEmail' must be implemented.");
    }

    async findById(userId) {
        throw new Error("Method 'findById' must be implemented.");
    }

    async upsertOtpUser(data) {
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
}

export default IAuthRepository;
