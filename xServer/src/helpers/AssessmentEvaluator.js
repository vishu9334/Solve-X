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
    // "clean" = fully clean, "suspicious" = minor warnings (still allowed to pass)
    // Only "rejected" means serious cheating and blocks passing
    return activityDecision === "clean" || activityDecision === "suspicious";
  }

  async evaluate(attempt, activitySession) {
    let assessment = attempt.assessmentId;
    if (assessment && mongoose.Types.ObjectId.isValid(assessment)) {
      assessment = await AssessmentStore.findById(assessment);
    }

    const totalQuestions = assessment?.totalQuestions || 0;
    const passingPercentage = assessment?.passingPercentage || 70;

    const correctCount = await Answer.countDocuments({
      attemptId: attempt._id,
      isCorrect: true
    });

    // Count actual total answers submitted for this attempt (more accurate than stored totalQuestions)
    const actualTotalAnswered = await Answer.countDocuments({
      attemptId: attempt._id
    });

    // Use the larger of stored totalQuestions vs actual answers to avoid inflated scores
    const effectiveTotal = Math.max(totalQuestions, actualTotalAnswered);

    const score = effectiveTotal > 0 ? Math.round((correctCount / effectiveTotal) * 100) : 0;

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
