import { IEmployee,ICreateEmployee, IUpdateEmployee } from "../../interfaces/company/IEmployee.types";
import { sendEmail } from "../../utils/email";
// import { DepartmentRepository } from "../../repositories/company/departmentRepository";
import { Connection } from "mongoose";
import { EmployeeRepository } from "../../repositories/company/employeeRepository";
import { IUserRepository } from "../../interfaces/IUser.types";

export class EmployeeService {
  constructor(private readonly employeeRepository:EmployeeRepository,
    private readonly userRepository:IUserRepository) {}

  async getEmployees(tenantConnection: Connection): Promise<IEmployee[]> {
    try {
      const employees = await this.employeeRepository.getEmployees(tenantConnection);
      return employees;
    } catch (error) {
      console.error("Error in EmployeeService.getEmployees:", error);
      throw error;
    }
  }

  async addEmployee( employeeData: ICreateEmployee, 
    tenantConnection:Connection): Promise<IEmployee | boolean> {
    try {
      const existingUser = await this.userRepository.findByEmail(employeeData.email,);
      if(existingUser)
      throw new Error("This email is  already exists");
     
      const data={
      email:employeeData.email,
      companyName :tenantConnection.name,
      role :'EMPLOYEE',
      password : 'helloemployee',
      isActive:true
      }
    
     const user =  await this.userRepository.createUser(data);
     await sendEmail( user.email,"Successfully Registered to the company ", `Your Password  is : ${data.password}`)


      const newEmployee = await this.employeeRepository.createEmployee( employeeData, 
        tenantConnection);
      console.log('newDepartmetdata',newEmployee)
      return newEmployee;
    } catch (error) {
      throw error;
    }
  }


  async updateEmployee(
    id: string,
    updateData: IUpdateEmployee,
    connection: Connection
  ): Promise<IEmployee> {
    if (!id || !updateData) {
      throw new Error('Employee ID and update data are required');
    }

    const updatedEmployee = await this.employeeRepository.update(id, updateData, connection);
    if (!updatedEmployee) {
      throw new Error('Employee not found');
    }

    return updatedEmployee;
  }


}