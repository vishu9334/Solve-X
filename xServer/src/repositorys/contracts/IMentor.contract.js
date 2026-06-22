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

    async updateMentorProfile(userId, updateData) {
        throw new Error("Method not implemented");
    }

    async updateMentorDescription(userId, description) {
        throw new Error("Method not implemented");
    }

    async findAttemptWithAssessment(attemptId, userId) {
        throw new Error("Method not implemented");
    }

    async findUserById(userId) {
        throw new Error("Method not implemented");
    }

    async findAttemptByAssessment(userId, assessmentId) {
        throw new Error("Method not implemented");
    }

    async findAssessmentStoreById(assessmentId) {
        throw new Error("Method not implemented");
    }

    async updateAssessmentStore(assessmentId, updateData) {
        throw new Error("Method not implemented");
    }

    async findLatestActivitySession(userId, assessmentId) {
        throw new Error("Method not implemented");
    }

    async saveAnswers(attemptId, answersToInsert) {
        throw new Error("Method not implemented");
    }

    async saveAttempt(attempt) {
        throw new Error("Method not implemented");
    }

    async findSkillByAssessmentId(assessmentId) {
        throw new Error("Method not implemented");
    }

    async saveMentorProfile(mentorProfile) {
        throw new Error("Method not implemented");
    }

    async findActiveSessionForMentor(userId) {
        throw new Error("Method not implemented");
    }

    async findOpenDoubtSession(doubtSessionId) {
        throw new Error("Method not implemented");
    }

    async saveDoubtSession(doubtSession) {
        throw new Error("Method not implemented");
    }

    async countActiveBids(userId) {
        throw new Error("Method not implemented");
    }
}

export default IMentorRepository;