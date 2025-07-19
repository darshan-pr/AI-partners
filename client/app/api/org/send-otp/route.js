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

    // Validate email domain
    if (!org_mail.endsWith('@reva.edu.in')) {
      return NextResponse.json(
        { success: false, message: 'Only @reva.edu.in domain is allowed' },
        { status: 400 }
      );
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Create nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Enhanced email options for organization verification
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: org_mail,
      subject: 'AI Partner - Knowledge Nest Organization Verification',
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.1);">
          
          <!-- Header Section -->
          <div style="background: rgba(255,255,255,0.1); padding: 30px 40px; text-align: center; backdrop-filter: blur(10px);">
            <div style="background: white; width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
              <div style="width: 40px; height: 40px; background: linear-gradient(45deg, #667eea, #764ba2); border-radius: 8px; position: relative;">
                <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: white; font-weight: bold; font-size: 16px;">🧠</div>
              </div>
            </div>
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 300; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">
              AI Partner
            </h1>
            <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0; font-size: 16px;">
              Knowledge Nest Organization Verification
            </p>
          </div>

          <!-- Content Section -->
          <div style="background: white; padding: 40px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h2 style="color: #333; margin: 0 0 10px; font-size: 24px; font-weight: 600;">
                Verify Your Organization Email
              </h2>
              <p style="color: #666; margin: 0; font-size: 16px; line-height: 1.5;">
                Welcome to Knowledge Nest! Please use the verification code below to complete your organization registration.
              </p>
            </div>

            <!-- OTP Display -->
            <div style="background: linear-gradient(135deg, #f8f9ff 0%, #e8f2ff 100%); border: 2px solid #e3f2fd; border-radius: 15px; padding: 30px; text-align: center; margin: 30px 0; position: relative; overflow: hidden;">
              <div style="position: absolute; top: -20px; right: -20px; width: 80px; height: 80px; background: linear-gradient(45deg, #667eea, #764ba2); border-radius: 50%; opacity: 0.1;"></div>
              <div style="position: absolute; bottom: -30px; left: -30px; width: 100px; height: 100px; background: linear-gradient(45deg, #764ba2, #667eea); border-radius: 50%; opacity: 0.1;"></div>
              
              <p style="color: #555; margin: 0 0 15px; font-size: 16px; font-weight: 500;">
                Your Verification Code
              </p>
              <div style="background: white; border-radius: 12px; padding: 20px; margin: 10px auto; display: inline-block; box-shadow: 0 8px 25px rgba(102, 126, 234, 0.15); position: relative; z-index: 2;">
                <h1 style="color: #667eea; font-size: 36px; margin: 0; letter-spacing: 8px; font-weight: 700; text-shadow: 0 2px 4px rgba(102, 126, 234, 0.2);">
                  ${otp}
                </h1>
              </div>
            </div>

            <!-- Instructions -->
            <div style="background: #f8f9fa; border-radius: 12px; padding: 25px; margin: 25px 0;">
              <h3 style="color: #333; margin: 0 0 15px; font-size: 18px; font-weight: 600;">
                📋 Next Steps:
              </h3>
              <ol style="color: #555; margin: 0; padding-left: 20px; line-height: 1.6;">
                <li style="margin-bottom: 8px;">Enter this 6-digit code in the Knowledge Nest verification form</li>
                <li style="margin-bottom: 8px;">Complete your organization profile information</li>
                <li style="margin-bottom: 8px;">Start collaborating with your institution's learning resources</li>
              </ol>
            </div>

            <!-- Features Highlight -->
            <div style="border: 1px solid #e9ecef; border-radius: 12px; padding: 25px; margin: 25px 0; background: linear-gradient(135deg, #fff 0%, #f8f9ff 100%);">
              <h3 style="color: #333; margin: 0 0 20px; font-size: 18px; font-weight: 600; text-align: center;">
                🚀 What's Available in Knowledge Nest
              </h3>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div style="text-align: center;">
                  <div style="background: linear-gradient(45deg, #667eea, #764ba2); color: white; border-radius: 8px; padding: 8px; margin: 0 auto 8px; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">📚</div>
                  <p style="color: #555; margin: 0; font-size: 14px; font-weight: 500;">Resource Sharing</p>
                </div>
                <div style="text-align: center;">
                  <div style="background: linear-gradient(45deg, #667eea, #764ba2); color: white; border-radius: 8px; padding: 8px; margin: 0 auto 8px; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">🔍</div>
                  <p style="color: #555; margin: 0; font-size: 14px; font-weight: 500;">Smart Search</p>
                </div>
                <div style="text-align: center;">
                  <div style="background: linear-gradient(45deg, #667eea, #764ba2); color: white; border-radius: 8px; padding: 8px; margin: 0 auto 8px; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">👥</div>
                  <p style="color: #555; margin: 0; font-size: 14px; font-weight: 500;">Collaboration</p>
                </div>
                <div style="text-align: center;">
                  <div style="background: linear-gradient(45deg, #667eea, #764ba2); color: white; border-radius: 8px; padding: 8px; margin: 0 auto 8px; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">📊</div>
                  <p style="color: #555; margin: 0; font-size: 14px; font-weight: 500;">Analytics</p>
                </div>
              </div>
            </div>

            <!-- Security Notice -->
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin: 25px 0;">
              <div style="display: flex; align-items: center; margin-bottom: 10px;">
                <span style="color: #856404; font-size: 20px; margin-right: 10px;">⚠️</span>
                <h4 style="color: #856404; margin: 0; font-size: 16px; font-weight: 600;">Security Notice</h4>
              </div>
              <ul style="color: #856404; margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.5;">
                <li>This OTP will expire in <strong>10 minutes</strong></li>
                <li>Do not share this code with anyone</li>
                <li>If you didn't request this verification, please ignore this email</li>
                <li>Only @reva.edu.in email addresses are accepted</li>
              </ul>
            </div>
          </div>

          <!-- Footer -->
          <div style="background: #f8f9fa; padding: 30px 40px; text-align: center; border-top: 1px solid #e9ecef;">
            <p style="color: #6c757d; margin: 0 0 10px; font-size: 14px;">
              This email was sent from AI Partner Knowledge Nest
            </p>
            <p style="color: #adb5bd; margin: 0; font-size: 12px;">
              © ${new Date().getFullYear()} AI Partner. Empowering collaborative learning.
            </p>
          </div>
        </div>
      `,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    // Store OTP in database using existing verification system
    await convex.mutation(api.auth.storeOTP, {
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
