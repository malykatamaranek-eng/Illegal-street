import nodemailer, { Transporter } from 'nodemailer';
import Bull, { Queue, Job } from 'bull';
import logger from '../config/logger';
import { InternalServerError } from '../utils/errors';

interface EmailJob {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface User {
  email: string;
  username: string;
  id: string;
}

class EmailService {
  private transporter: Transporter;
  private emailQueue!: Queue<EmailJob>;
  private queueEnabled: boolean;

  constructor() {
    // Initialize SMTP transporter
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    // Initialize Bull queue
    this.queueEnabled = process.env.EMAIL_QUEUE_ENABLED === 'true';

    if (this.queueEnabled) {
      this.emailQueue = new Bull('email', {
        redis: {
          host: process.env.QUEUE_REDIS_HOST || 'localhost',
          port: parseInt(process.env.QUEUE_REDIS_PORT || '6379', 10),
          password: process.env.QUEUE_REDIS_PASSWORD || undefined,
        },
      });

      // Process email queue
      this.emailQueue.process(async (job: Job<EmailJob>) => {
        return this.sendEmailDirect(job.data);
      });

      // Queue event listeners
      this.emailQueue.on('completed', (job: Job) => {
        logger.info(`Email job ${job.id} completed`);
      });

      this.emailQueue.on('failed', (job: Job, err: Error) => {
        logger.error(`Email job ${job.id} failed:`, err);
      });
    }
  }

  /**
   * Send email (queued if enabled, direct otherwise)
   */
  async sendEmail(to: string, subject: string, html: string, text?: string): Promise<void> {
    try {
      const emailData: EmailJob = { to, subject, html, text };

      if (this.queueEnabled) {
        // Add to queue
        await this.emailQueue.add(emailData, {
          attempts: parseInt(process.env.JOB_ATTEMPTS || '3', 10),
          backoff: {
            type: process.env.JOB_BACKOFF_TYPE as 'exponential' | 'fixed' || 'exponential',
            delay: parseInt(process.env.JOB_BACKOFF_DELAY || '1000', 10),
          },
        });
        logger.info(`Email queued for: ${to}`);
      } else {
        // Send directly
        await this.sendEmailDirect(emailData);
      }
    } catch (error) {
      logger.error('Send email error:', error);
      throw new InternalServerError('Failed to send email');
    }
  }

  /**
   * Send email directly via SMTP
   */
  private async sendEmailDirect(data: EmailJob): Promise<void> {
    try {
      // Check if in mock mode (development)
      if (process.env.DEV_MOCK_EMAIL === 'true') {
        logger.info(`[MOCK EMAIL] To: ${data.to}, Subject: ${data.subject}`);
        return;
      }

      const fromEmail = process.env.SMTP_FROM_EMAIL || 'noreply@illegal-street.com';
      const fromName = process.env.SMTP_FROM_NAME || 'Illegal Street';

      await this.transporter.sendMail({
        from: `${fromName} <${fromEmail}>`,
        to: data.to,
        subject: data.subject,
        html: data.html,
        text: data.text || data.html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
      });

      logger.info(`Email sent to: ${data.to}`);
    } catch (error) {
      logger.error('Send email direct error:', error);
      throw error;
    }
  }

  /**
   * Send verification email
   */
  async sendVerificationEmail(user: User, token: string): Promise<void> {
    try {
      if (process.env.EMAIL_VERIFICATION_ENABLED !== 'true') {
        logger.info('Email verification is disabled');
        return;
      }

      const verificationUrl = `${process.env.APP_URL}/verify-email?token=${token}`;

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .button { 
              display: inline-block; 
              padding: 12px 24px; 
              background-color: #007bff; 
              color: #ffffff; 
              text-decoration: none; 
              border-radius: 4px; 
              margin: 20px 0;
            }
            .footer { margin-top: 30px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Welcome to Illegal Street, ${user.username}!</h1>
            <p>Thank you for registering. Please verify your email address to activate your account.</p>
            <a href="${verificationUrl}" class="button">Verify Email Address</a>
            <p>Or copy and paste this link into your browser:</p>
            <p>${verificationUrl}</p>
            <p>This link will expire in 24 hours.</p>
            <div class="footer">
              <p>If you didn't create an account, please ignore this email.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      await this.sendEmail(user.email, 'Verify Your Email - Illegal Street', html);
    } catch (error) {
      logger.error('Send verification email error:', error);
      throw error;
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(user: User, token: string): Promise<void> {
    try {
      const resetUrl = `${process.env.APP_URL}/reset-password?token=${token}`;

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .button { 
              display: inline-block; 
              padding: 12px 24px; 
              background-color: #dc3545; 
              color: #ffffff; 
              text-decoration: none; 
              border-radius: 4px; 
              margin: 20px 0;
            }
            .warning { 
              background-color: #fff3cd; 
              border: 1px solid #ffc107; 
              padding: 10px; 
              border-radius: 4px; 
              margin: 20px 0;
            }
            .footer { margin-top: 30px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Password Reset Request</h1>
            <p>Hello ${user.username},</p>
            <p>We received a request to reset your password. Click the button below to proceed:</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            <p>Or copy and paste this link into your browser:</p>
            <p>${resetUrl}</p>
            <div class="warning">
              <strong>Security Notice:</strong>
              <p>This link will expire in 1 hour for your security.</p>
            </div>
            <div class="footer">
              <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      await this.sendEmail(user.email, 'Password Reset - Illegal Street', html);
    } catch (error) {
      logger.error('Send password reset email error:', error);
      throw error;
    }
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(user: User): Promise<void> {
    try {
      if (process.env.EMAIL_WELCOME_ENABLED !== 'true') {
        logger.info('Welcome email is disabled');
        return;
      }

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #007bff; color: #ffffff; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .button { 
              display: inline-block; 
              padding: 12px 24px; 
              background-color: #28a745; 
              color: #ffffff; 
              text-decoration: none; 
              border-radius: 4px; 
              margin: 20px 0;
            }
            .features { margin: 20px 0; }
            .feature { 
              margin: 10px 0; 
              padding: 10px; 
              background-color: #f8f9fa; 
              border-left: 4px solid #007bff;
            }
            .footer { margin-top: 30px; font-size: 12px; color: #666; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Illegal Street!</h1>
            </div>
            <div class="content">
              <h2>Hello ${user.username}! 🎉</h2>
              <p>We're excited to have you join our community of learners and creators.</p>
              
              <div class="features">
                <h3>What you can do:</h3>
                <div class="feature">📚 Access exclusive learning modules</div>
                <div class="feature">🎯 Take quizzes and earn points</div>
                <div class="feature">🏆 Unlock achievements and badges</div>
                <div class="feature">👥 Connect with other members</div>
                <div class="feature">🛍️ Shop exclusive merchandise</div>
              </div>

              <a href="${process.env.APP_URL}/dashboard" class="button">Get Started</a>
            </div>
            <div class="footer">
              <p>Need help? Contact us at support@illegal-street.com</p>
              <p>&copy; 2024 Illegal Street. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      await this.sendEmail(user.email, 'Welcome to Illegal Street! 🎉', html);
    } catch (error) {
      logger.error('Send welcome email error:', error);
      throw error;
    }
  }

  /**
   * Close queue connection
   */
  async close(): Promise<void> {
    if (this.queueEnabled && this.emailQueue) {
      await this.emailQueue.close();
    }
  }
}

export default new EmailService();
