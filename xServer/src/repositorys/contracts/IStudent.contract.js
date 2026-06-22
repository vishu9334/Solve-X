class IstudentContract {
    async findStudentProfile(userId) {
        throw new Error("Method not implemented");
    }
    async findSkillIdentifier(skillIdentifier) {
        throw new Error("Method not implemented");
    }
    async findMentorBySkill(skillId) {
        throw new Error("Method not implemented");
    }
    async createDoubtSession(data) {
        throw new Error("Method not implemented");
    }
    async updateDoubtSession(sessionId, updateData) {
        throw new Error("Method not implemented");
    }
    async studentDashboard(userId) {
        throw new Error("Method not implemented");
    }
    async updateStudentBio(userId, bio) {
        throw new Error("Method not implemented");
    }
    async updateStudentProfileFields(userId, updateData) {
        throw new Error("Method not implemented");
    }
    async updateStudentName(userId, name) {
        throw new Error("Method not implemented");
    }
    async findActiveSessionForStudent(studentId) {
        throw new Error("Method not implemented");
    }
    async findActiveSessionForStudentPopulated(studentId) {
        throw new Error("Method not implemented");
    }
    async findDoubtSessionById(sessionId) {
        throw new Error("Method not implemented");
    }
    async saveDoubtSession(session) {
        throw new Error("Method not implemented");
    }
    async findMentorProfileByUserId(userId) {
        throw new Error("Method not implemented");
    }
    async findActiveSessionForMentor(mentorId) {
        throw new Error("Method not implemented");
    }
    async findDoubtSessionByIdAndStudent(doubtSessionId, studentId) {
        throw new Error("Method not implemented");
    }
    async findDoubtSessionByIdAndStudentWithOffers(doubtSessionId, studentId) {
        throw new Error("Method not implemented");
    }
    async findDoubtSessionByIdAndStudentWithDetails(doubtSessionId, studentId) {
        throw new Error("Method not implemented");
    }
    async createStudentProfile(userId, data) {
        throw new Error("Method not implemented");
    }
    async countDoubtSessions(studentId, status) {
        throw new Error("Method not implemented");
    }
    async findCompletedDoubtSessions(studentId) {
        throw new Error("Method not implemented");
    }
    async findRecentDoubtSessions(studentId, limit) {
        throw new Error("Method not implemented");
    }
}

export default IstudentContract