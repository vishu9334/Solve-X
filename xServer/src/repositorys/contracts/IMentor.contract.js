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

    async createAttempt(userId, assessmentId) {
        throw new Error("Method not implemented");
    }
}

export default IMentorRepository;