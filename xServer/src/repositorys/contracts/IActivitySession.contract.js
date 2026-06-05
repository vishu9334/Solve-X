class IActivitySessionRepository {
  async createSession(sessionData) {
    throw new Error("Method not implemented");
  }

  async findSessionById(sessionId) {
    throw new Error("Method not implemented");
  }

  async findSessionByIdWithUser(sessionId) {
    throw new Error("Method not implemented");
  }

  async findSessionsByUser(query) {
    throw new Error("Method not implemented");
  }

  async findSessionReportById(sessionId) {
    throw new Error("Method not implemented");
  }

  async saveSession(session) {
    throw new Error("Method not implemented");
  }
}

export default IActivitySessionRepository;
