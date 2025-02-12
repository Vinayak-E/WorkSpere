import { Connection, connection } from "mongoose";
import { GetCompanyProjectsOptions, GetProjectsOptions, IProject, ITask } from "../../interfaces/company/IProject.types";
import { ProjectRepository } from "../../repositories/employee/projectRepository";
import { EmployeeRepository } from "../../repositories/employee/employeeRepository";
import { IEmployee } from "../../interfaces/company/IEmployee.types";

export class ProjectService {
    constructor(private readonly projectRepository:ProjectRepository,private readonly employeeRepository:EmployeeRepository) {}
  
    async createProject(connection: Connection, projectData: IProject): Promise<IProject> {
      if (!projectData.manager) {
        throw new Error("Manager ID is required");
      }

      const manager = await this.employeeRepository.getEmployeeById(connection, projectData.manager.toString());
      if (!manager) {
        throw new Error("Manager not found");
      }
    
      const departmentId = (manager.department as any)._id 
        ? (manager.department as any)._id.toString() 
        : manager.department.toString();
    
  
      const projectToCreate: IProject = {
        ...projectData,
        department: departmentId, 
        status: "Pending",
        employees: []
      };

      return this.projectRepository.createProject(connection, projectToCreate);
    }
    
    async getManagerProjects(connection: Connection, options: GetProjectsOptions) {
      const { page, limit, search, employeeId } = options;
      const skip = (page - 1) * limit;
    
      const query = { 
        manager: employeeId,
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ]
      };
    
      const [projects, total] = await Promise.all([
        this.projectRepository.getProjectsByManager(connection, query, skip, limit),
        this.projectRepository.countProjects(connection, query)
      ]);
    
      return {
        data: projects,
        totalPages: Math.ceil(total / limit),
        currentPage: page
      };
    }



      async getProjectDetails(connection: Connection, projectId: string): Promise<{project: IProject | null, tasks:ITask[],departmentEmployees: IEmployee[]}> {
        const project = await this.projectRepository.getProjectById(connection, projectId);
        
        if (!project) {
            throw new Error("Project not found");
        }

        const departmentId = project.department._id || project.department.toString();
        const departmentEmployees = await this.employeeRepository.getEmployeesByDepartment(connection, departmentId);
        const tasks = await this.projectRepository.getTasksByProjectId(connection, projectId);

        return {
            project,
            tasks,
            departmentEmployees
        };
    }
    

      async addTask(connection: Connection, taskData: ITask): Promise<ITask | null> {
        return this.projectRepository.createTask(connection, taskData);
      }



      async updateProject( id:string, connection: Connection, updateData: IProject ): Promise<IProject> {
        try{
  
          const updatedProject = await this.projectRepository.update(id, updateData, connection);
          if (!updatedProject) {
            throw new Error('Employee not found');
          }
      
          return updatedProject;
        } catch (error) {
          console.error("Error in CompanyService.getEmployeeProfile:", error);
          throw error;
      }
      }


      async updateProjectStatus( id:string, connection: Connection, status: string ): Promise<IProject> {
        try{
  
          const updatedProject = await this.projectRepository.updateStatus(id, status, connection);
          if (!updatedProject) {
            throw new Error('Employee not found');
          }
      
          return updatedProject;
        } catch (error) {
          console.error("Error in CompanyService.getEmployeeProfile:", error);
          throw error;
      }
      }


      async getEmployeeTasks(
        connection: Connection,
        options: { employeeId: string; page: number; limit: number; search?: string; status?: string }
      ): Promise<{ data: ITask[]; totalPages: number; currentPage: number }> {
        const { employeeId, page, limit, search = '', status = '' } = options;
        const skip = (page - 1) * limit;
    
        const [tasks, total] = await Promise.all([
          this.projectRepository.getTasksByEmployee(connection, employeeId, search, status, skip, limit),
          this.projectRepository.countTasksByEmployee(connection, employeeId, search, status)
        ]);
    
        return {
          data: tasks,
          totalPages: Math.ceil(total / limit),
          currentPage: page
        };
      }
    
      async updateTaskStatus(
        connection: Connection,
        taskId: string,
        status: string
      ): Promise<ITask | null> {

       
      
        return this.projectRepository.updateTaskStatus(connection, taskId, status);
      }


      async getAllProjects(
        connection: Connection,
        options: GetCompanyProjectsOptions
      ): Promise<{ data: IProject[]; totalPages: number; currentPage: number }> {
        const { page, limit, search, status, department } = options;
        const skip = (page - 1) * limit;
  
        const query: any = {};
        
        if (search) {
          query.$or = [
            { name: { $regex: search, $options: "i" } },
            { description: { $regex: search, $options: "i" } }
          ];
        }
        if (status) {
          query.status = status;
        }
        if (department) {
          query.department = department; 
        }
    
        const [projects, total] = await Promise.all([
          this.projectRepository.getAllProjects(connection, query, skip, limit),
          this.projectRepository.countAllProjects(connection, query)
        ]);
    
        return {
          data: projects,
          totalPages: Math.ceil(total / limit),
          currentPage: page
        };
      }


      async updateProjectTask(
        connection: Connection,
        projectId: string,
        taskId: string,
        taskData: Partial<ITask>
      ): Promise<ITask> {

        const project = await this.projectRepository.getProjectById(connection, projectId);
        if (!project) {
          throw new Error("Project not found");
        }


        if (taskData.assignee) {
          const employee = await this.employeeRepository.getEmployeeById(connection, taskData.assignee.toString());
          if (!employee) {
            throw new Error("Assignee not found");
          }
        }
      
 
        const updatedTask = await this.projectRepository.updateProjectTask(connection,projectId,taskId,taskData);
      
        if (!updatedTask) {
          throw new Error("Failed to update task");
        }
      
        return updatedTask;
      }
    
    }

    