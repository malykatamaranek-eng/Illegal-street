import prisma from '../config/prisma';
import logger from '../config/logger';

export class ModuleService {
  /**
   * Get all modules with filters
   */
  async getModules(filters: {
    category?: string;
    difficulty?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    try {
      const {
        category,
        difficulty,
        search,
        page = 1,
        limit = 20,
      } = filters;
      const skip = (page - 1) * limit;

      const where: any = {};

      if (category) {
        where.category = category;
      }

      if (difficulty) {
        where.difficulty = difficulty;
      }

      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [modules, total] = await Promise.all([
        prisma.module.findMany({
          where,
          include: {
            _count: {
              select: {
                courses: true,
                quizzes: true,
              },
            },
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.module.count({ where }),
      ]);

      return {
        modules,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      logger.error('Error fetching modules:', error);
      throw new Error('Failed to fetch modules');
    }
  }

  /**
   * Get module by ID
   */
  async getModuleById(id: string, userId?: string) {
    try {
      const module = await prisma.module.findUnique({
        where: { id },
        include: {
          courses: {
            orderBy: { lessonNumber: 'asc' },
          },
          quizzes: true,
          _count: {
            select: {
              userProgress: true,
            },
          },
        },
      });

      if (!module) {
        throw new Error('Module not found');
      }

      // Get user progress if userId provided
      let userProgress = null;
      if (userId) {
        userProgress = await prisma.userProgress.findUnique({
          where: {
            userId_moduleId: { userId, moduleId: id },
          },
        });
      }

      return {
        ...module,
        userProgress,
      };
    } catch (error) {
      logger.error('Error fetching module:', error);
      throw error;
    }
  }

  /**
   * Get courses for a module
   */
  async getModuleCourses(moduleId: string) {
    try {
      return await prisma.course.findMany({
        where: { moduleId },
        orderBy: { lessonNumber: 'asc' },
      });
    } catch (error) {
      logger.error('Error fetching courses:', error);
      throw new Error('Failed to fetch courses');
    }
  }

  /**
   * Get course by ID
   */
  async getCourseById(id: string) {
    try {
      const course = await prisma.course.findUnique({
        where: { id },
        include: {
          module: {
            select: {
              id: true,
              title: true,
              category: true,
            },
          },
        },
      });

      if (!course) {
        throw new Error('Course not found');
      }

      return course;
    } catch (error) {
      logger.error('Error fetching course:', error);
      throw error;
    }
  }

  /**
   * Get quizzes for a module
   */
  async getModuleQuizzes(moduleId: string) {
    try {
      return await prisma.quiz.findMany({
        where: { moduleId },
      });
    } catch (error) {
      logger.error('Error fetching quizzes:', error);
      throw new Error('Failed to fetch quizzes');
    }
  }

  /**
   * Get quiz by ID
   */
  async getQuizById(id: string) {
    try {
      const quiz = await prisma.quiz.findUnique({
        where: { id },
        include: {
          module: {
            select: {
              id: true,
              title: true,
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
   * Submit quiz answers
   */
  async submitQuiz(
    userId: string,
    quizId: string,
    answers: any
  ) {
    try {
      const quiz = await prisma.quiz.findUnique({
        where: { id: quizId },
      });

      if (!quiz) {
        throw new Error('Quiz not found');
      }

      // Calculate score (simplified)
      const questions = quiz.questions as any;
      let correctAnswers = 0;
      
      if (Array.isArray(questions)) {
        questions.forEach((question: any, index: number) => {
          if (answers[index] === question.correctAnswer) {
            correctAnswers++;
          }
        });
      }

      const score = (correctAnswers / (questions?.length || 1)) * 100;

      // Save result
      const result = await prisma.quizResult.create({
        data: {
          userId,
          quizId,
          score,
          answers,
        },
      });

      // Award points if passed
      if (score >= 70) {
        const module = await prisma.module.findUnique({
          where: { id: quiz.moduleId },
        });

        if (module) {
          await prisma.user.update({
            where: { id: userId },
            data: {
              totalPoints: { increment: Math.floor(module.points * 0.5) },
            },
          });
        }
      }

      return result;
    } catch (error) {
      logger.error('Error submitting quiz:', error);
      throw error;
    }
  }

  /**
   * Get user quiz results
   */
  async getUserQuizResults(userId: string, quizId?: string) {
    try {
      const where: any = { userId };
      if (quizId) {
        where.quizId = quizId;
      }

      return await prisma.quizResult.findMany({
        where,
        include: {
          quiz: {
            include: {
              module: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
          },
        },
        orderBy: { completedAt: 'desc' },
      });
    } catch (error) {
      logger.error('Error fetching quiz results:', error);
      throw new Error('Failed to fetch quiz results');
    }
  }

  /**
   * Get module categories
   */
  async getCategories() {
    try {
      const modules = await prisma.module.findMany({
        select: { category: true },
        distinct: ['category'],
      });

      return modules.map((m) => m.category);
    } catch (error) {
      logger.error('Error fetching categories:', error);
      throw new Error('Failed to fetch categories');
    }
  }
}

export default new ModuleService();
