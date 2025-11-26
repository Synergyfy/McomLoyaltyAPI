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

  async sendPointsEarnedEmail(email: string, points: number, businessName: string, campaignName: string, newBalance: number) {
    await this.mailerService.sendMail({
      to: email,
      subject: 'You Earned Points!',
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); border: 1px solid #f0f0f0;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #ea580c; margin: 0; font-size: 28px; font-weight: 700;">Points Earned!</h2>
            <p style="color: #666; margin-top: 10px; font-size: 16px;">Congratulations on your recent activity</p>
          </div>
          
          <div style="color: #333333; font-size: 16px; line-height: 1.6;">
            <p>Hello,</p>
            <p>You have successfully earned points at <strong>${businessName}</strong> for the campaign <strong>${campaignName}</strong>.</p>
            
            <div style="text-align: center; margin: 35px 0;">
              <div style="display: inline-block; padding: 20px; border: 2px dashed #ea580c; border-radius: 12px; background-color: #fff7ed;">
                <span style="display: block; color: #ea580c; font-size: 36px; font-weight: bold;">+${points}</span>
                <span style="display: block; color: #666; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin-top: 5px;">Points Added</span>
              </div>
            </div>

            <p style="text-align: center; font-size: 18px;">
              Your new campaign balance: <strong>${newBalance}</strong>
            </p>
            
            <p>Keep engaging to unlock more rewards!</p>
            
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

  async sendRewardRedeemedEmail(email: string, rewardName: string, pointsSpent: number, businessName: string, campaignName: string, newBalance: number) {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Reward Redeemed!',
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); border: 1px solid #f0f0f0;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #ea580c; margin: 0; font-size: 28px; font-weight: 700;">Reward Redeemed!</h2>
            <p style="color: #666; margin-top: 10px; font-size: 16px;">Enjoy your reward</p>
          </div>
          
          <div style="color: #333333; font-size: 16px; line-height: 1.6;">
            <p>Hello,</p>
            <p>You have successfully redeemed a reward at <strong>${businessName}</strong> from the campaign <strong>${campaignName}</strong>.</p>
            
            <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 25px 0; text-align: center;">
              <h3 style="margin: 0 0 10px 0; color: #333;">${rewardName}</h3>
              <span style="display: inline-block; background-color: #ea580c; color: white; padding: 4px 12px; border-radius: 100px; font-size: 14px; font-weight: 600;">-${pointsSpent} Points</span>
            </div>

            <p style="text-align: center; font-size: 18px;">
              Your remaining campaign balance: <strong>${newBalance}</strong>
            </p>
            
            <p>Thank you for your loyalty!</p>
            
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
