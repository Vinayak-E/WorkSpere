import mongoose from 'mongoose';
import { IChatDocument, IMessageDocument } from '../../interfaces/IChat.types';
import { ChatRepository } from '../../repositories/employee/chatRepository';
import { EmployeeRepository } from '../../repositories/employee/employeeRepository';
import { IEmployee } from '../../interfaces/company/IEmployee.types';

export class ChatService {
  constructor(private readonly chatRepository: ChatRepository,private readonly employeeRepository:EmployeeRepository) {}

  async createChat(
    tenantConnection: mongoose.Connection,
    userId: string,
    currentUserEmail: string
  ): Promise<IChatDocument | null> {

    const user = await this.employeeRepository.getEmployeeByEmail(tenantConnection,currentUserEmail)
      
    if (!user) {
        throw new Error("User not found.");
      }
    
     const currentUserId = user._id
    const existingChat = await this.chatRepository.findExistingChat(
      tenantConnection,
      currentUserId,
      userId
    );

    if (existingChat) {
      return existingChat;
    }


    const chatData = {
      name: "sender",
      isGroupChat: false,
      users: [currentUserId, userId],
    };

    const createdChat = await this.chatRepository.createNewChat(
      tenantConnection,
      chatData
    );

    return await this.chatRepository.findChatById(
      tenantConnection,
      createdChat._id,
      ["users"]
    );
  }

  async createGroupChat(
    tenantConnection: mongoose.Connection,
    users: string[],
    name: string,
    adminEmail: string,
  ): Promise<IChatDocument | null> {

    const user = await this.employeeRepository.getEmployeeByEmail(tenantConnection,adminEmail)
      
    if (!user) {
        throw new Error("User not found.");
      }

      const adminId = user._id
    const groupChat = await this.chatRepository.createNewChat(
      tenantConnection,
      {
        name,
        users,
        isGroupChat: true,
        groupAdmin: adminId,
      }
    );

    return await this.chatRepository.findChatById(
      tenantConnection,
      groupChat._id,
      ["users", "groupAdmin"]
    );
  }

  async sendMessage(
    tenantConnection: mongoose.Connection,
    content: string,
    chatId: string,
    senderId: string,
    mediaUrl?: string,
    type?:string
  ): Promise<IMessageDocument> {

    const newMessage = await this.chatRepository.createMessage(
      tenantConnection,
      {
        sender: senderId,
        content,
        chat: chatId,
        mediaUrl: mediaUrl || null,
        type
      }
    );

    await this.chatRepository.updateChatLatestMessage(
      tenantConnection,
      chatId,
      newMessage._id as mongoose.Types.ObjectId
    );
  
    const message = await this.chatRepository.findMessageById(
      tenantConnection,
      newMessage._id as mongoose.Types.ObjectId
    );
  
    if (!message) {
      throw new Error("Message not found after creation.");
    }
  
    return message;
  }
  
  async getCurrentUser(
    tenantConnection: mongoose.Connection,
    email: string
  ) {
    const user = await this.employeeRepository.getEmployeeByEmail(tenantConnection, email);
    if (!user) {
      throw new Error("User not found");
    }
    return user;
  }

  async getAllChats(
    tenantConnection: mongoose.Connection,
    userId: string
  ): Promise<IChatDocument[]> {
    if (!userId) {
      throw new Error("User ID is required");
    }
  
    const chats = await this.chatRepository.findUserChats(
      tenantConnection,
      userId
    );
  
    if (!chats) {
      throw new Error("Error retrieving chats");
    }
  
    return chats;
  }

  async getChatMessages(
    tenantConnection: mongoose.Connection,
    chatId: string
  ): Promise<IMessageDocument[]> {
    return await this.chatRepository.findMessagesForChat(tenantConnection, chatId);
  }


  async markMessageAsRead(  tenantConnection: mongoose.Connection, messageId :string, readerId :string) {

           const message = await this.chatRepository.findByIdAndUpdate(tenantConnection,messageId)
           return message;
          
  }

  async addToGroup(
    tenantConnection: mongoose.Connection,
    chatId: string,
    userId: string
  ): Promise<IChatDocument | null> {
    const updatedChat = await this.chatRepository.addUserToGroup(
      tenantConnection,
      chatId,
      userId
    );

    if (!updatedChat) {
      throw new Error("Chat not found or update failed");
    }

    return await this.chatRepository.findChatById(
      tenantConnection,
      updatedChat._id,
      ["users", "groupAdmin"]
    );
  }

  async removeFromGroup(
    tenantConnection: mongoose.Connection,
    chatId: string,
    userId: string
  ): Promise<IChatDocument | null> {
    const updatedChat = await this.chatRepository.removeUserFromGroup(
      tenantConnection,
      chatId,
      userId
    );

    if (!updatedChat) {
      throw new Error("Chat not found or update failed");
    }

    return await this.chatRepository.findChatById(
      tenantConnection,
      updatedChat._id,
      ["users", "groupAdmin"]
    );
  }

  async getChatMembers(
    tenantConnection: mongoose.Connection,
    chatId: string
  ): Promise<IEmployee[]> {
    return await this.chatRepository.getChatMembers(tenantConnection, chatId);
  }

}

