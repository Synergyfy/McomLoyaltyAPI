import { Injectable } from "@nestjs/common";
import { MailerService } from "@nestjs-modules/mailer";

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendOtp(email: string, otp: string) {
    await this.mailerService.sendMail({
      to: email,
      subject: "Password Reset OTP",
      text: `Your OTP is ${otp}`,
    });
  }

  async sendInviteEmail(email: string, inviteCode: string) {
    await this.mailerService.sendMail({
      to: email,
      subject: "You have been invited to claim a QR Plaque",
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

  async sendPointsEarnedEmail(
    email: string,
    points: number,
    businessName: string,
    campaignName: string,
    newBalance: number,
  ) {
    await this.mailerService.sendMail({
      to: email,
      subject: "You Earned Points!",
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

  async sendStampEarnedEmail(
    email: string,
    stamps: number,
    businessName: string,
    campaignName: string,
    currentStamps: number,
  ) {
    await this.mailerService.sendMail({
      to: email,
      subject: "You Earned a Stamp!",
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); border: 1px solid #f0f0f0;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #ea580c; margin: 0; font-size: 28px; font-weight: 700;">Stamp Earned!</h2>
            <p style="color: #666; margin-top: 10px; font-size: 16px;">Congratulations on your recent activity</p>
          </div>
          
          <div style="color: #333333; font-size: 16px; line-height: 1.6;">
            <p>Hello,</p>
            <p>You have successfully earned <strong>${stamps}</strong> stamp(s) at <strong>${businessName}</strong> for the campaign <strong>${campaignName}</strong>.</p>
            
            <div style="text-align: center; margin: 35px 0;">
              <div style="display: inline-block; padding: 20px; border: 2px dashed #ea580c; border-radius: 12px; background-color: #fff7ed;">
                <span style="display: block; color: #ea580c; font-size: 36px; font-weight: bold;">+${stamps} Stamp(s)</span>
                <span style="display: block; color: #666; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin-top: 5px;">Collection Updated</span>
              </div>
            </div>

            <p style="text-align: center; font-size: 18px;">
              Your current stamp card: <strong>${currentStamps} stamp(s)</strong>
            </p>
            
            <p>Gather more stamps to unlock your reward!</p>
            
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

  async sendRewardRedeemedEmail(
    email: string,
    rewardName: string,
    pointsSpent: number,
    businessName: string,
    campaignName: string,
    newBalance: number,
    voucherCode?: string,
  ) {
    await this.mailerService.sendMail({
      to: email,
      subject: "Reward Redeemed!",
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

            ${
              voucherCode
                ? `
            <div style="background-color: #f0fdf4; padding: 15px; border: 1px dashed #16a34a; border-radius: 8px; margin-top: 15px; text-align: center;">
                <p style="margin: 0; font-size: 14px; color: #166534; font-weight: bold;">Your Reward Code:</p>
                <p style="margin: 5px 0 0 0; font-size: 24px; font-family: monospace; letter-spacing: 2px; color: #15803d;">${voucherCode}</p>
            </div>
            `
                : ""
            }

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

  async sendBusinessActivityEmail(
    email: string,
    activityType: "EARN" | "REDEEM" | "ALLOWANCE_WARNING" | "JOIN",
    points: number,
    participantName: string,
    staffName: string,
    campaignName: string,
    details: string,
  ) {
    let title = "";
    let color = "";

    switch (activityType) {
      case "EARN":
        title = "Points Awarded";
        color = "#10b981"; // Green
        break;
      case "REDEEM":
        title = "Reward Redeemed";
        color = "#ea580c"; // Orange
        break;
      case "ALLOWANCE_WARNING":
        title = "Allowance Warning";
        color = "#ef4444"; // Red
        break;
      case "JOIN":
        title = "New Participant";
        color = "#3b82f6"; // Blue
        break;
    }

    await this.mailerService.sendMail({
      to: email,
      subject: `New Activity: ${title}`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); border: 1px solid #f0f0f0;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #333; margin: 0; font-size: 24px; font-weight: 700;">New Campaign Activity</h2>
            <p style="color: #666; margin-top: 10px; font-size: 16px;">${campaignName}</p>
          </div>
          
          <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; border-left: 4px solid ${color}; margin-bottom: 25px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
              <span style="font-weight: bold; color: #333; font-size: 18px;">${title}</span>
              <span style="font-weight: bold; color: ${color}; font-size: 18px;">${activityType === "EARN" ? "+" : "-"}${points} Pts</span>
            </div>
            <p style="margin: 0; color: #64748b; font-size: 14px;">${details}</p>
          </div>

          <div style="color: #333333; font-size: 15px; line-height: 1.6;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666;">Participant:</td>
                <td style="padding: 8px 0; font-weight: 600; text-align: right;">${participantName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; border-top: 1px solid #eee;">Processed By:</td>
                <td style="padding: 8px 0; font-weight: 600; text-align: right; border-top: 1px solid #eee;">${staffName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; border-top: 1px solid #eee;">Date:</td>
                <td style="padding: 8px 0; font-weight: 600; text-align: right; border-top: 1px solid #eee;">${new Date().toLocaleString()}</td>
              </tr>
            </table>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="font-size: 14px; color: #888; text-align: center;">
              <strong>The Mcom Loyalty Team</strong>
            </p>
          </div>
        </div>
      `,
    });
  }

  async sendCampaignJoinedEmail(
    email: string,
    campaignName: string,
    businessName: string,
    signUpPoints: number,
  ) {
    await this.mailerService.sendMail({
      to: email,
      subject: `Welcome to ${campaignName}!`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); border: 1px solid #f0f0f0;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #ea580c; margin: 0; font-size: 28px; font-weight: 700;">Welcome Aboard!</h2>
            <p style="color: #666; margin-top: 10px; font-size: 16px;">You've joined a new campaign</p>
          </div>
          
          <div style="color: #333333; font-size: 16px; line-height: 1.6;">
            <p>Hello,</p>
            <p>You have successfully joined the <strong>${campaignName}</strong> campaign at <strong>${businessName}</strong>.</p>
            
            ${
              signUpPoints > 0
                ? `
            <div style="text-align: center; margin: 35px 0;">
              <div style="display: inline-block; padding: 15px 30px; background-color: #fff7ed; border-radius: 8px; border: 1px solid #ea580c;">
                <span style="display: block; color: #ea580c; font-size: 24px; font-weight: bold;">+${signUpPoints} Points</span>
                <span style="display: block; color: #666; font-size: 12px; margin-top: 4px;">Sign-up Bonus</span>
              </div>
            </div>
            `
                : ""
            }
            
            <p>Start engaging with ${businessName} to earn more points and unlock exclusive rewards!</p>
            
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
  async sendWishlistCampaignEmail(
    email: string,
    campaignName: string,
    businessName: string,
    itemName: string,
    ctaLink: string,
  ) {
    await this.mailerService.sendMail({
      to: email,
      subject: `Good News! A Campaign for ${itemName} is Here!`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); border: 1px solid #f0f0f0;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #ea580c; margin: 0; font-size: 28px; font-weight: 700;">Wishlist Alert!</h2>
            <p style="color: #666; margin-top: 10px; font-size: 16px;">Something you wanted is now part of a campaign</p>
          </div>
          
          <div style="color: #333333; font-size: 16px; line-height: 1.6;">
            <p>Hello,</p>
            <p>Great news! <strong>${businessName}</strong> has launched a new campaign <strong>${campaignName}</strong> that features an item from your wishlist: <strong>${itemName}</strong>.</p>
            
            <div style="text-align: center; margin: 35px 0;">
              <a href="${ctaLink}" style="display: inline-block; background-color: #ea580c; color: #ffffff; font-size: 18px; font-weight: bold; padding: 16px 32px; border-radius: 8px; text-decoration: none; box-shadow: 0 4px 12px rgba(234, 88, 12, 0.3);">
                View Campaign
              </a>
            </div>
            
            <p>Don't miss out on this opportunity to earn points and rewards!</p>
            
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
  async sendMatchingPointsReceivedEmail(
    to: string,
    points: number,
    activity: string,
    totalBalance: number,
  ) {
    await this.mailerService.sendMail({
      to,
      subject: "You Earned Matching Points! 🎉",
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); border: 1px solid #f0f0f0;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #ea580c; margin: 0; font-size: 28px; font-weight: 700;">Matching Points Earned!</h2>
            <p style="color: #666; margin-top: 10px; font-size: 16px;">You've received points for: ${activity}</p>
          </div>
          
          <div style="color: #333333; font-size: 16px; line-height: 1.6;">
            <p>Hello,</p>
            <p>You have successfully earned matching points.</p>
            
            <div style="text-align: center; margin: 35px 0;">
              <div style="display: inline-block; padding: 20px; border: 2px dashed #ea580c; border-radius: 12px; background-color: #fff7ed;">
                <span style="display: block; color: #ea580c; font-size: 36px; font-weight: bold;">+${points}</span>
                <span style="display: block; color: #666; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin-top: 5px;">Matching Points</span>
              </div>
            </div>

            <p style="text-align: center; font-size: 18px;">
              Your new matching balance: <strong>${totalBalance}</strong>
            </p>
            
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

  async sendLevelPromotionEmail(
    email: string,
    participantName: string,
    newLevelName: string,
    benefits: string[],
  ) {
    const benefitsHtml = benefits
      .map((b) => `<li style="margin-bottom: 8px;">${b}</li>`)
      .join("");

    await this.mailerService.sendMail({
      to: email,
      subject: `Congratulations! You are now ${newLevelName}! 🏆`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); border: 1px solid #f0f0f0;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #ea580c; margin: 0; font-size: 28px; font-weight: 700;">Level Up!</h2>
            <p style="color: #666; margin-top: 10px; font-size: 16px;">You've reached a new milestone</p>
          </div>
          
          <div style="color: #333333; font-size: 16px; line-height: 1.6;">
            <p>Hello <strong>${participantName}</strong>,</p>
            <p>Congratulations! Your dedication has paid off. You have been promoted to the <strong>${newLevelName}</strong> level.</p>
            
            <div style="text-align: center; margin: 35px 0;">
              <span style="display: inline-block; background-color: #ea580c; color: #ffffff; font-size: 24px; font-weight: bold; padding: 16px 32px; border-radius: 8px; letter-spacing: 1px; box-shadow: 0 4px 12px rgba(234, 88, 12, 0.3);">
                ${newLevelName} Member
              </span>
            </div>
            
            <div style="background-color: #f9fafb; border-radius: 8px; padding: 25px; margin: 25px 0;">
              <h3 style="margin-top: 0; color: #333; font-size: 18px;">Your New Benefits:</h3>
              <ul style="padding-left: 20px; margin-bottom: 0; color: #555;">
                ${benefitsHtml}
              </ul>
            </div>
            
            <p>Keep engaging to reach the next level!</p>
            
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
