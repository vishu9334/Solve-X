import mongoose from "mongoose";
import { Answer } from "../models/Answer.model.js";
import { AssessmentStore } from "../models/assessmentDataStore.model.js";

class AssessmentEvaluator {
  canAttempt(attempt) {
    if (!attempt) return true;
    return attempt.attempts.length < attempt.maxAttempts;
  }

  isPassed(score, passingPercentage) {
    return score >= passingPercentage;
  }

  isActivityClean(activityDecision) {
    return activityDecision === "clean";
  }

  async evaluate(attempt, activitySession) {
    let assessment = attempt.assessmentId;
    if (assessment && mongoose.Types.ObjectId.isValid(assessment)) {
      assessment = await AssessmentStore.findById(assessment);
    }

    const totalQuestions = assessment?.totalQuestions || 5;
    const passingPercentage = assessment?.passingPercentage || 70;

    const correctCount = await Answer.countDocuments({
      attemptId: attempt._id,
      isCorrect: true
    });

    const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

    const isScorePassed = this.isPassed(score, passingPercentage);
    const isClean = this.isActivityClean(activitySession.activityDecision);

    const isPassedFinal = isScorePassed && isClean;

    return {
      score,
      isPassed: isPassedFinal,
      isScorePassed,
      isClean,
      activityDecision: activitySession.activityDecision,
      correctCount,
      totalQuestions
    };
  }
}

export default new AssessmentEvaluator();
