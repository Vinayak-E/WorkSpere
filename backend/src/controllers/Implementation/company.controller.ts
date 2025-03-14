import { Request, Response, NextFunction, RequestHandler } from 'express';
import { injectable, inject } from 'tsyringe';
import { ICompanyDocument } from '../../interfaces/company/company.types';
import { CompanyService } from '../../services/Implementation/company.service';
import { PaymentService } from '../../services/Implementation/payment.service';

@injectable()
export class CompanyController {
  constructor(
    @inject('CompanyService') private readonly companyService: CompanyService,
    @inject('PaymentService') private paymentService: PaymentService
  ) {}

  updateProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantConnection = req.tenantConnection;
      if (!tenantConnection) {
         res.status(500).json({ success: false, message: 'Tenant connection not established' });
         return;
      }
      const { id } = req.params;
      if (!id) {
        res.status(400).json({ success: false, message: 'Company ID is required' });
        return; 
      }
      const updateData: ICompanyDocument = req.body;
      const updatedCompany = await this.companyService.updateProfile(id, tenantConnection, updateData);
       res.status(200).json({
        success: true,
        message: 'Company updated successfully',
        data: updatedCompany
      });
      return; 
    } catch (error) {
      next(error);
    }
  };

  getEmployees = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantConnection = req.tenantConnection;
      if (!tenantConnection) {
        res.status(500).json({ success: false, message: 'Tenant connection not established' });
        return;
      }
      const employees = await this.companyService.getEmployees(tenantConnection);
     res.status(200).json({ success: true, data: employees });
     return;
    } catch (error) {
      next(error);
    }
  };

  addEmployee  = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantConnection = req.tenantConnection;
      const tenantId = req.tenantId;
      if (!tenantConnection || !tenantId) {
        res.status(500).json({ success: false, message: 'Tenant connection not established' });
        return;
      }
      const employeeData = req.body;
      const newEmployee = await this.companyService.addEmployee(employeeData, tenantConnection, tenantId);
         res.status(201).json({
        success: true,
        message: 'Employee created successfully',
        data: newEmployee
      });
      return;
    } catch (error) {
      next(error);
    }
  };
  
  updateEmployee = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantConnection = req.tenantConnection;
      if (!tenantConnection) {
        res.status(500).json({ success: false, message: 'Tenant connection not established' });
        return;
      }
      const { id } = req.params;
      if (!id) {
         res.status(400).json({ success: false, message: 'Employee ID is required' });
         return;
      }
      const updateData = req.body;
      const updatedEmployee = await this.companyService.updateEmployee(id, updateData, tenantConnection);
        res.status(200).json({
        success: true,
        message: 'Employee updated successfully',
        data: updatedEmployee
      });
      return;
    } catch (error) {
      next(error);
    }
  };
  getCompanyPaymentHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.userId;
      if (!companyId) {
        res.status(400).json({
          success: false,
          message: 'Company ID not found in request',
        });
        return;
      }
      
      const payments = await this.paymentService.getCompanyPaymentHistory(companyId);
      
      res.status(200).json({
        success: true,
        data: payments,
      });
    } catch (error) {
      console.error('Payment history error:', error);
      next(error);
    }
  };

  getCurrentPlan = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.userId
      const tenantId = req.tenantId;
      console.log('companyid',companyId)
      console.log('tenantd',tenantId)
      if (!companyId || !tenantId) {
        res.status(400).json({
          success: false,
          message: 'Company ID or Tenant ID not found in request',
        });
        return;
      }
      const currentPlan = await this.paymentService.getCompanyCurrentPlan(companyId, tenantId);
      res.status(200).json({
        success: true,
        data: currentPlan,
      });
    } catch (error) {
      console.error('Current plan error:', error);
      next(error);
    }
  };
}
