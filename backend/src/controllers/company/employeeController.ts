import { Request, Response, NextFunction } from "express";
import { RequestHandler } from "express-serve-static-core";
import { ICreateEmployee, IUpdateEmployee } from "../../interfaces/company/IEmployee.types";
import { EmployeeService } from "../../services/company/employee.service";

export class EmployeeController {
    constructor(private readonly employeeService: EmployeeService) {}


    getEmployees: RequestHandler = async ( req: Request, res: Response,next: NextFunction) => {
        try {
          const tenantConnection = req.tenantConnection;
          
          if (!tenantConnection) {
               res.status(500).json({ 
              success: false,
              message: "Tenant connection not established" 
            });
            return
          }
    
          const employees = await this.employeeService.getEmployees(tenantConnection);

             res.status(200).json({
            success: true,
            data: employees
          });
        } catch (error) {
          console.error("Error fetching employees:", error);
          next(error);
        }
      };

    addEmployee: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const tenantConnection = req.tenantConnection;

            if (!tenantConnection) {
                 res.status(500).json({ 
                    success: false,
                    message: "Tenant connection not established" 
                });
                return
            }

            const { name, email, mobile, department, position, gender, status } = req.body;
            

            const employeeData: ICreateEmployee = {
                name,
                email,
                mobile,
                department,
                position,
                gender,
                status
            };

            const newEmployee = await this.employeeService.addEmployee(employeeData, tenantConnection);

             res.status(201).json({
                success: true,
                message: "Employee created successfully",
                data: newEmployee
            });
        } catch (error) {
            next(error);
        }
    };


    updateEmployee: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
        try {
          const tenantConnection = req.tenantConnection;
          
          if (!tenantConnection) {
        res.status(500).json({ 
              success: false,
              message: "Tenant connection not established" 
            });
            return
          }
    
          const { id } = req.params;
        
          console.log('reqId at updateemploye',req.params)
          console.log('req.body at updateemploye',req.body)
    
          if (!id) {
             res.status(400).json({
            success: false,
            message: "Employee ID is required"
          });
          return
        }
    
        const updateData: IUpdateEmployee = req.body;
    
          const updatedEmployee= await this.employeeService.updateEmployee(
            id,
            updateData,
            tenantConnection
          );
    
            res.status(200).json({
            success: true,
            message: "Employee updated successfully",
            data: updatedEmployee
          });
        } catch (error) {
          next(error);
        }
      };
}