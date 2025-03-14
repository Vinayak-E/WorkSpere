import { IUser } from '../IUser.types';
import { ICompanyRequest } from '../company/company.types';

export interface IAdminLoginData {
  email: string;
  password: string;
}

export interface IAdminService {
  verifyAdmin(
    email: string,
    password: string
  ): Promise<{ accessToken: string; refreshToken: string } | null>;
  getCompanies(): Promise<any>;
  updateCompanyStatus(
    companyId: string,
    isActive: boolean
  ): Promise<IUser | null>;
  updateCompanyRequest(
    companyId: string,
    isApproved: string,
    reason: string
  ): Promise<IUser | null>;
  getProfile(email: string): Promise<IUser | null>;
}

export interface IAdminRepository {
  findByEmail(email: string): Promise<IUser | null>;
  findCompanies(): Promise<any>;
  updateStatus(companyId: string, isActive: boolean): Promise<IUser | null>;
  updateRequest(companyId: string, isApproved: string): Promise<IUser | null>;
  findTempCompany(companyName: string): Promise<ICompanyRequest | null>;
  deleteTempCompany(companyId: string): Promise<void>;
}
