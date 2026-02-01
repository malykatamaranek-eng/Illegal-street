import prisma from '../config/prisma';
import logger from '../config/logger';
import { Prisma } from '@prisma/client';

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
}

export class QuizService {
  /**
   * Get all quizzes with optional filtering
   */
  async getQuizzes(moduleId?: string) {
    try {
      const where: Prisma.QuizWhereInput = {};
      if (moduleId) {
        where.moduleId = moduleId;
      }

      const quizzes = await prisma.quiz.findMany({
        where,
        include: {
          module: {
            select: {
              id: true,
              title: true,
              category: true,
              difficulty: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return quizzes;
    } catch (error) {
      logger.error('Error fetching quizzes:', error);
      throw new Error('Failed to fetch quizzes');
    }
  }

  /**
   * Get quiz by ID
   */
  async getQuizById(quizId: string) {
    try {
      const quiz = await prisma.quiz.findUnique({
        where: { id: quizId },
        include: {
          module: {
            select: {
              id: true,
              title: true,
              category: true,
              difficulty: true,
            },
          },
        },
      });

      if (!quiz) {
        throw new Error('Quiz not found');
      }

      return quiz;
    } catch (error) {
      logger.error('Error fetching quiz:', error);
      throw error;
    }
  }

  /**
   * Start a quiz attempt
   */
  async startQuiz(userId: string, quizId: string) {
    try {
      // Verify quiz exists
      const quiz = await prisma.quiz.findUnique({
        where: { id: quizId },
      });

      if (!quiz) {
        throw new Error('Quiz not found');
      }

      // Create quiz attempt
      const attempt = await prisma.quizResult.create({
        data: {
          userId,
          quizId,
          score: 0,
          answers: {},
        },
      });

      logger.info(`User ${userId} started quiz ${quizId}`);

      return attempt;
    } catch (error) {
      logger.error('Error starting quiz:', error);
      throw error;
    }
  }

  /**
   * Submit quiz and calculate score
   */
  async submitQuiz(
    userId: string,
    quizId: string,
    attemptId: string,
    answers: Record<string, number>
  ) {
    try {
      // Get quiz with questions
      const quiz = await prisma.quiz.findUnique({
        where: { id: quizId },
      });

      if (!quiz) {
        throw new Error('Quiz not found');
      }

      // Verify attempt belongs to user
      const attempt = await prisma.quizResult.findFirst({
        where: {
          id: attemptId,
          userId,
          quizId,
        },
      });

      if (!attempt) {
        throw new Error('Quiz attempt not found');
      }

      // Calculate score
      const questions = quiz.questions as unknown as QuizQuestion[];
      let correctAnswers = 0;
      const totalQuestions = questions.length;

      questions.forEach((question, index) => {
        const questionKey = index.toString();
        const userAnswer = answers[questionKey];
        if (userAnswer !== undefined && userAnswer === question.correctAnswer) {
          correctAnswers++;
        }
      });

      const score = (correctAnswers / totalQuestions) * 100;

      // Update quiz result
      const result = await prisma.quizResult.update({
        where: { id: attemptId },
        data: {
          score,
          answers,
          completedAt: new Date(),
        },
      });

      logger.info(`User ${userId} submitted quiz ${quizId} with score ${score}`);

      return {
        result,
        score,
        correctAnswers,
        totalQuestions,
        passed: score >= 70,
      };
    } catch (error) {
      logger.error('Error submitting quiz:', error);
      throw error;
    }
  }

  /**
   * Get quiz results for a user
   */
  async getQuizResults(userId: string, quizId: string) {
    try {
      const results = await prisma.quizResult.findMany({
        where: {
          userId,
          quizId,
        },
        orderBy: { completedAt: 'desc' },
      });

      return results;
    } catch (error) {
      logger.error('Error fetching quiz results:', error);
      throw new Error('Failed to fetch quiz results');
    }
  }

  /**
   * Get user's quiz history
   */
  async getUserQuizzes(userId: string) {
    try {
      const results = await prisma.quizResult.findMany({
        where: { userId },
        include: {
          quiz: {
            include: {
              module: {
                select: {
                  id: true,
                  title: true,
                  category: true,
                },
              },
            },
          },
        },
        orderBy: { completedAt: 'desc' },
      });

      return results;
    } catch (error) {
      logger.error('Error fetching user quizzes:', error);
      throw new Error('Failed to fetch user quizzes');
    }
  }

  /**
   * Get quiz statistics
   */
  async getQuizStatistics(quizId: string) {
    try {
      const [totalAttempts, averageScore, passRate] = await Promise.all([
        prisma.quizResult.count({
          where: { quizId },
        }),
        prisma.quizResult.aggregate({
          where: { quizId },
          _avg: {
            score: true,
          },
        }),
        prisma.quizResult.count({
          where: {
            quizId,
            score: {
              gte: 70,
            },
          },
        }),
      ]);

      return {
        totalAttempts,
        averageScore: averageScore._avg.score || 0,
        passRate: totalAttempts > 0 ? (passRate / totalAttempts) * 100 : 0,
      };
    } catch (error) {
      logger.error('Error fetching quiz statistics:', error);
      throw new Error('Failed to fetch quiz statistics');
    }
  }

  /**
   * Get quizzes by category
   */
  async getQuizzesByCategory(category: string) {
    try {
      const quizzes = await prisma.quiz.findMany({
        where: {
          module: {
            category,
          },
        },
        include: {
          module: {
            select: {
              id: true,
              title: true,
              category: true,
              difficulty: true,
            },
          },
        },
      });

      return quizzes;
    } catch (error) {
      logger.error('Error fetching quizzes by category:', error);
      throw new Error('Failed to fetch quizzes by category');
    }
  }

  /**
   * Delete quiz (admin only)
   */
  async deleteQuiz(quizId: string) {
    try {
      await prisma.quiz.delete({
        where: { id: quizId },
      });

      logger.info(`Quiz ${quizId} deleted`);
    } catch (error) {
      logger.error('Error deleting quiz:', error);
      throw new Error('Failed to delete quiz');
    }
  }
}

export const quizService = new QuizService();
export default quizService;
