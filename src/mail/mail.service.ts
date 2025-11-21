import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) { }

  async sendOtp(email: string, otp: string) {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Password Reset OTP',
      text: `Your OTP is ${otp}`,
    });
  }

  async sendInviteEmail(email: string, inviteCode: string) {
    await this.mailerService.sendMail({
      to: email,
      subject: 'You have been invited to claim a QR Plaque',
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); border: 1px solid #f0f0f0;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #ea580c; margin: 0; font-size: 28px; font-weight: 700;">You've Been Invited!</h2>
            <p style="color: #666; margin-top: 10px; font-size: 16px;">Join the network and manage your QR Plaque</p>
          </div>
          
          <div style="color: #333333; font-size: 16px; line-height: 1.6;">
            <p>Hello,</p>
            <p>A business has invited you to take ownership of a <strong>QR Plaque</strong>. This plaque allows you to engage with customers and track loyalty progress.</p>
            
            <p>To claim your plaque, please use the unique invitation code below:</p>
            
            <div style="text-align: center; margin: 35px 0;">
              <span style="display: inline-block; background-color: #ea580c; color: #ffffff; font-size: 28px; font-weight: bold; padding: 16px 32px; border-radius: 8px; letter-spacing: 3px; box-shadow: 0 4px 12px rgba(234, 88, 12, 0.3);">
                ${inviteCode}
              </span>
            </div>
            
            <p>Simply enter this code in the application to verify your invite. If you don't have an account yet, you will be guided through the registration process.</p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="font-size: 14px; color: #888; text-align: center;">
              Best regards,<br>
              <strong>The Mcom Loyalty Team</strong>
            </p>
          </div>
        </div>
      `,
    });
  }
}