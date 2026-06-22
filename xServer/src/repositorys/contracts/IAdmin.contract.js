class IAdminRepository {
    async getAdminProfileWithDetails(userId) {
        throw new Error("Method not implemented");
    }

    async createAdminProfile(userId) {
        throw new Error("Method not implemented");
    }

    async updateAdminProfile(userId, updateData) {
        throw new Error("Method not implemented");
    }

    async findUserById(userId) {
        throw new Error("Method not implemented");
    }

    async getAdminDashboardStats(onlineIds) {
        throw new Error("Method not implemented");
    }
}

export default IAdminRepository;
