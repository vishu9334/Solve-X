class IMentorRepository {
    async findMentorProfile(userId) {
        throw new Error("Method not implemented");
    }

    async updateMentorSkill(userId, skillId) {
        throw new Error("Method not implemented");
    }

    async findSkillById(skillId) {
        throw new Error("Method not implemented");
    }

    async findSkillByName(name) {
        throw new Error("Method not implemented");
    }

    async createSkillWithAssessment({ name, createdBy, source }) {
        throw new Error("Method not implemented");
    }

    async incrementMentorCount(skillId) {
        throw new Error("Method not implemented");
    }

    async decrementAndCleanup(skillId) {
        throw new Error("Method not implemented");
    }

    async createAttempt(userId, assessmentId) {
        throw new Error("Method not implemented");
    }

    async mentorProfileFetch(userId) {
        throw new Error("Method not implemented");
    }

    async mentorDashboardFetch(userId) {
        throw new Error("Method not implemented");
    }

    async updateMentorDescription(userId, description) {
        throw new Error("Method not implemented");
    }
}

export default IMentorRepository;