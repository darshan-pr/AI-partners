import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

export async function POST(request) {
  try {
    const { orgEmail } = await request.json();

    if (!orgEmail) {
      return NextResponse.json(
        { success: false, message: 'Organization email is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(orgEmail)) {
      return NextResponse.json(
        { success: false, message: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if domain is allowed
    const allowedDomains = ['reva.edu.in'];
    const domain = orgEmail.split('@')[1];
    if (!allowedDomains.includes(domain)) {
      return NextResponse.json(
        { success: false, message: 'Invalid organization domain. Only @reva.edu.in emails are allowed.' },
        { status: 400 }
      );
    }

    // Check if org email already exists
    const existingOrg = await convex.query(api.orgVerification.checkOrgEmailExists, {
      orgEmail: orgEmail
    });

    if (existingOrg) {
      return NextResponse.json(
        { success: false, message: 'This organization email is already registered' },
        { status: 400 }
      );
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Create nodemailer transporter (using existing auth setup)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Email options for organization verification
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: orgEmail,
      subject: 'Organization Verification OTP - AI Partner',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Organization Verification</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-top: 20px;">
            <h2 style="color: #333; text-align: center; margin-bottom: 20px;">Your Verification Code</h2>
            
            <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <h1 style="color: #667eea; font-size: 36px; margin: 0; letter-spacing: 8px;">${otp}</h1>
            </div>
            
            <p style="color: #666; text-align: center; margin: 20px 0;">
              Enter this code to verify your organization email address.
            </p>
            
            <p style="color: #999; font-size: 14px; text-align: center;">
              This code will expire in 10 minutes for security reasons.
            </p>
            
            <p style="color: #999; font-size: 14px; text-align: center;">
              If you didn't request this verification, please ignore this email.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding: 20px;">
            <p style="color: #999; font-size: 12px;">
              © 2024 AI Partner. All rights reserved.
            </p>
          </div>
        </div>
      `,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    // Store OTP in organization verification table
    await convex.mutation(api.orgVerification.storeOrgOTP, {
      orgEmail: orgEmail,
      otp: otp,
    });

    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully to your organization email',
    });

  } catch (error) {
    console.error('Error sending organization OTP:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to send OTP' },
      { status: 500 }
    );
  }
}
