import mongoose, { Connection, Document } from 'mongoose';
import { IAttendance, ILeave } from './IAttendance.types';
import { IDepartment } from './IDepartment.types';

export interface IEmployee extends Document {
  _id: string;
  employeeId: string;
  name: string;
  email: string;
  mobile: string;
  position: string;
  role: string;
  gender: string;
  status: string;
  department: IDepartment;
  dob: Date;
  salary: number;
  workMode: 'Remote' | 'On-Site' | 'Hybrid';
  profilePicture: string;

  address: {
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };

  qualifications: {
    degree: string;
    institution: string;
    yearOfCompletion: string;
  }[];

  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateEmployee {
  employeeId: string;
  name: string;
  email: string;
  mobile: string;
  position: string;
  role: string;
  status: string;
  gender: string;
  department: mongoose.Schema.Types.ObjectId;
  dob: Date;
  salary: number;
  workMode: string;
  profilePicture: string;
  address: {
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  qualifications: {
    degree: string;
    institution: string;
    yearOfCompletion: string;
  }[];
}

export interface IUpdateEmployee {
  name?: string;
  email: string;
  mobile?: string;
  position?: string;
  gender?: string;
  role?: string;
  department?: mongoose.Schema.Types.ObjectId;
  status?: string;
}

export interface IEmployeeService {
  getEmployeeProfile(connection: Connection, email: string): Promise<IEmployee>;
  updateProfile(
    id: string,
    connection: Connection,
    updateData: IUpdateEmployee
  ): Promise<IEmployee>;
  getDepartmentEmployees(
    connection: Connection,
    userEmail: string
  ): Promise<IEmployee[]>;
}
