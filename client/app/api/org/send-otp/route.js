import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

export async function POST(request) {
  try {
    const { org_mail } = await request.json();

    if (!org_mail) {
      return NextResponse.json(
        { success: false, message: 'Organization email is required' },
        { status: 400 }
      );
    }

    if (!org_mail.endsWith('@reva.edu.in')) {
      return NextResponse.json(
        { success: false, message: 'Only @reva.edu.in domain is allowed' },
        { status: 400 }
      );
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: org_mail,
      subject: 'AI Partner – Knowledge Nest Organization Verification',
      html: `
        <div style="font-family: Arial, sans-serif; background:#f4f4f4; padding:20px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; margin:auto; background:#ffffff; border-radius:8px; overflow:hidden;">
            
            <!-- HEADER -->
            <tr>
              <td style="background:#1a73e8; padding:20px; text-align:center; color:#ffffff;">
                <h1 style="margin:0; font-size:24px;">AI Partner</h1>
                <p style="margin:5px 0 0; font-size:16px;">Knowledge Nest Organization Verification</p>
              </td>
            </tr>

            <!-- BODY -->
            <tr>
              <td style="padding:30px;">
                <h2 style="font-size:20px; color:#333333; margin-bottom:10px;">Verify Your Organization Email</h2>
                <p style="font-size:14px; color:#555555; line-height:1.5;">
                  Welcome to Knowledge Nest! Use the verification code below to complete your organization registration.
                </p>

                <!-- OTP CODE -->
                <div style="margin:30px 0; text-align:center;">
                  <p style="font-size:14px; color:#555555; margin-bottom:10px;">Your Verification Code</p>
                  <div style="display:inline-block; padding:20px 30px; background:#f1f3f5; border-radius:6px;">
                    <span style="font-size:32px; letter-spacing:4px; font-weight:bold; color:#1a73e8;">${otp}</span>
                  </div>
                </div>

                <!-- NEXT STEPS -->
                <h3 style="font-size:16px; color:#333333; margin-bottom:10px;">Next Steps:</h3>
                <ol style="font-size:14px; color:#555555; line-height:1.6; padding-left:20px; margin:0;">
                  <li>Enter this 6‑digit code in the verification form.</li>
                  <li>Complete your organization profile.</li>
                  <li>Start collaborating with your institution's resources.</li>
                </ol>

                <!-- FEATURES -->
                <h3 style="font-size:16px; color:#333333; margin:25px 0 10px;">What's in Knowledge Nest:</h3>
                <table width="100%" cellpadding="0" cellspacing="0" style="text-align:center;">
                  <tr>
                    <td style="padding:10px;">
                      <div style="font-size:24px;">📚</div>
                      <p style="font-size:14px; color:#555555; margin:5px 0 0;">Resource Sharing</p>
                    </td>
                    <td style="padding:10px;">
                      <div style="font-size:24px;">🔍</div>
                      <p style="font-size:14px; color:#555555; margin:5px 0 0;">Smart Search</p>
                    </td>
                    <td style="padding:10px;">
                      <div style="font-size:24px;">👥</div>
                      <p style="font-size:14px; color:#555555; margin:5px 0 0;">Collaboration</p>
                    </td>
                    <td style="padding:10px;">
                      <div style="font-size:24px;">📊</div>
                      <p style="font-size:14px; color:#555555; margin:5px 0 0;">Analytics</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- FOOTER NOTES -->
            <tr>
              <td style="background:#fafafa; padding:20px; border-top:1px solid #e2e2e2;">
                <p style="font-size:12px; color:#888888; margin:0;">
                  This OTP expires in <strong>10 minutes</strong>. Do not share this code.
                </p>
                <p style="font-size:12px; color:#888888; margin:5px 0 0;">
                  If you didn’t request this, please ignore. Only @reva.edu.in emails are accepted.
                </p>
              </td>
            </tr>

            <!-- COPYRIGHT -->
            <tr>
              <td style="background:#f4f4f4; padding:15px; text-align:center;">
                <p style="font-size:12px; color:#aaaaaa; margin:0;">
                  © ${new Date().getFullYear()} AI Partner. Empowering collaborative learning.
                </p>
              </td>
            </tr>

          </table>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    await convex.mutation(api.org.storeOrgOTP, {
      email: org_mail,
      otp: otp,
    });

    return NextResponse.json({
      success: true,
      message: 'Organization verification OTP sent successfully to your email',
    });
  } catch (error) {
    console.error('Error sending organization OTP:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to send organization verification OTP' },
      { status: 500 }
    );
  }
}