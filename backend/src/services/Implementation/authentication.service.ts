import {redisClient } from "../../configs/redisClient";
import { IJwtService } from "../../interfaces/IJwtService.types";
import { IUserRepository } from "../../interfaces/IUser.types";
import {ICompanySignup,IVerifyOtpDto,ICompanyService,ICompanyRepository,ICompanyUser,DecodedToken} from "../../interfaces/company/company.types";
import { sendEmail,sendResetEmail} from "../../utils/email"; 

import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken";
import slugify from "slugify";
import { generateCompanySlug, hashPassword ,generateOTP, setRedisData} from "../../helpers/helperFunctions";
import { ISignup } from "../Interface/IAuthService.types";


export class AuthService implements ICompanyService {

  constructor(
          private readonly companyRepository: ICompanyRepository,
          private readonly userRepository :IUserRepository,
          private readonly jwtService :IJwtService
      ) {}


async signup(data: ISignup): Promise<string | boolean > {
  try {
        const {  email, password, phone ,bussinessRegNo, city,country, industry,state,zipcode} = data;
        const companyName  = generateCompanySlug(data.companyName) 
        const existingUser = await this.userRepository.findByEmailOrCompanyName(data.email, companyName);
        if (existingUser) return false
        const hashedPassword = await hashPassword(password);
        const otp = await generateOTP();
        console.log('otp', otp);
        const redisKey = `user:register:${email}`;
        await setRedisData(redisKey, { email, password: hashedPassword, companyName, phone, otp,bussinessRegNo, city,country, industry,state,zipcode }, 300);
        await sendEmail( email,"Verify Your Email", `Your OTP is ${otp}`)
        return data.email;


      } catch (error) {
        throw error
      }
}


async verifyOtp(data: IVerifyOtpDto): Promise<boolean> {
  try {
        const redisKey = `user:register:${data.email}`;
        const userData = await redisClient.get(redisKey);
        if (!userData) throw new Error("OTP expired or invalid");
        const parsedData = JSON.parse(userData);
        if (parsedData.otp !== data.otp) throw new Error("Invalid OTP");  
        parsedData.role ='COMPANY'
        await this.userRepository.createUser(parsedData);
        await this.companyRepository.createTempCompany(parsedData)
        await redisClient.del(redisKey);
        return true;

      }catch (error){
        throw error
      }
}





async resendOtp(email: string): Promise<boolean> {
  try {

        const redisKey = `user:register:${email}`;
        const userData = await redisClient.get(redisKey);
        if (!userData) throw new Error("OTP expired or invalid");
        const parsedData = JSON.parse(userData);
        const newOtp = generateOTP();
        console.log('otp',newOtp);
        parsedData.otp = newOtp;
        await setRedisData(redisKey,parsedData,300);
        await sendEmail(email, "Resend OTP", `Your new OTP is ${newOtp}`);
        return true;

      } catch (error) {
        throw error
      }
}


async verifyLogin(email: string, password: string, userType: string): Promise<{user: ICompanyUser , refreshToken: string , accessToken: string, tenantId: string ,forcePasswordChange?: boolean} | null> {
    try {
        const user = await this.userRepository.findByEmail(email);
        if (!user) return null;
        const isDefaultPassword = (userType === 'EMPLOYEE' || userType === 'MANAGER') &&   password === 'helloemployee';
        
        if (isDefaultPassword) {
            const isPasswordValid = password === 'helloemployee';
            if (!isPasswordValid) return null;

        
            const tenantId = slugify(user.companyName).toUpperCase();
            const data = {
                tenantId,
                email: user.email,
                role: user.role,
            };

            const [accessToken, refreshToken] = await Promise.all([
                this.jwtService.generateAccessToken(data),
                this.jwtService.generateRefreshToken(data)
            ]);

            return {
                user: data,
                accessToken,
                refreshToken,
                tenantId,
                forcePasswordChange: true
            };
        }

      
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) return null;

        if (!user.isActive) {
            throw new Error("You are blocked from this account");
        }
        
        if(user.role == 'COMPANY'){

          if (user.isApproved === 'Pending' || user.isApproved === 'Rejected') {
              throw new Error("Your Request is still under pending you will get a confirmation email");
          }
        }

        const tenantId = slugify(user.companyName).toUpperCase();
        const data = {
            tenantId,
            email: user.email,
            role: user.role,
        };

        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.generateAccessToken(data),
            this.jwtService.generateRefreshToken(data)
        ]);

        return { user: data, accessToken, refreshToken, tenantId };
    } catch (error) {
        console.error('Error verifying login:', error);
        throw error;
    }
}




async generateAccessToken(userId: string): Promise<string> {
  try {
      return jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET!, { expiresIn: '20s' });
  } catch (error) {
      console.error('Error generating access token:', error);
      throw new Error('Failed to generate access token');
  }
}


async sendResetLink(email: string) {
try {
    if (!process.env.RESET_LINK_SECRET) {
        console.error('RESET_LINK_SECRET is not configured');
        return null;
    }

    const existingUser = await this.userRepository.findByEmail(email);
    if (!existingUser) {
        return false;
    }
      
       
    const payload = { email };
    const resetToken = jwt.sign(
        payload, 
        process.env.RESET_LINK_SECRET, 
        { expiresIn: '1h' }
    );
    console.log('reset token founds',resetToken)

    const tokenExpiry = new Date(Date.now() + 3600 * 1000);
    await this.companyRepository.storeResetToken(email, resetToken, tokenExpiry);

    const resetLink = `http://localhost:5173/resetPassword?token=${resetToken}`;
    await sendResetEmail(
        email, 
        "Password Reset", 
        `Click here to reset your password: ${resetLink}`
    );

    console.log("Reset link sent:", resetLink);
    return true;
} catch (error) {
    console.error('Error sending reset link to the mail:', error);
    return null;
}
}

async resetPassword (email: string, password :string) {
try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await this.userRepository.resetPassword(email, hashedPassword);
} catch (error) {
    console.error('Error reseting the password:', error);
    throw new Error('Error reseting the password');
}
}


async verifyAccessToken (token: string)  {

try {
  return jwt.verify(token, process.env.JWT_SECRETKEY!) as DecodedToken;
} catch (error) {
  console.error("Token verification failed:", error)
  return null;
}
}




async findOrCreateCompany(profile: any): Promise<any> {

const email = profile.email;
const existingUser = await this.companyRepository.findByEmail(email);

if (existingUser) {
  return existingUser;
}

const newUser = {
  companyName:null,
  email,
  phone :null,
  googleId: profile.uid,
  password: profile.password || null,
};


}
 
}