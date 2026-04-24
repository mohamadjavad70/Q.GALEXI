import type { IToolRegistry, RegisteredTool, ToolExecutionContext } from "@/contracts/ToolContracts";
import { Logger } from "@/services/Logger";
import type { IPermissionLayer } from "@/contracts/SecurityContracts";
import { PermissionDeniedError } from "@/errors";

/**
 * Built-in tools registry with production-ready implementations
 */
export class BuiltInTools {
  private logger = new Logger();

  /**
   * WhatsApp message sending tool
   */
  async sendWhatsApp(
    to: string,
    message: string,
    context?: ToolExecutionContext,
    permission?: IPermissionLayer
  ): Promise<boolean> {
    // Permission check
    if (permission && context?.actorId) {
      const allowed = permission.can(context.actorId, 'messaging.whatsapp');
      if (!allowed) {
        this.logger.warn('WhatsApp send denied', { to, actorId: context.actorId });
        throw new PermissionDeniedError('WhatsApp permission denied', { to });
      }
    }

    try {
      const response = await fetch('http://localhost:3001/api/tools/send-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, message, timestamp: Date.now() }),
      });

      const success = response.ok;
      this.logger.info('WhatsApp sent', { to, success });
      return success;
    } catch (error) {
      this.logger.error('WhatsApp send failed', { to, error });
      return false;
    }
  }

  /**
   * Email sending tool
   */
  async sendEmail(
    to: string,
    subject: string,
    body: string,
    context?: ToolExecutionContext,
    permission?: IPermissionLayer
  ): Promise<boolean> {
    if (permission && context?.actorId) {
      const allowed = permission.can(context.actorId, 'messaging.email');
      if (!allowed) {
        throw new PermissionDeniedError('Email permission denied', { to });
      }
    }

    try {
      const response = await fetch('http://localhost:3001/api/tools/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, subject, body, timestamp: Date.now() }),
      });
      return response.ok;
    } catch (error) {
      this.logger.error('Email send failed', { to, error });
      return false;
    }
  }

  /**
   * Order pizza tool
   */
  async orderPizza(
    pizzaType: string,
    size: string,
    address: string,
    context?: ToolExecutionContext,
    permission?: IPermissionLayer
  ): Promise<{ orderId: string; status: string }> {
    if (permission && context?.actorId) {
      const allowed = permission.can(context.actorId, 'commerce.order');
      if (!allowed) {
        throw new PermissionDeniedError('Order permission denied', { pizzaType });
      }
    }

    try {
      const response = await fetch('http://localhost:3001/api/tools/order-pizza', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pizzaType, size, address, timestamp: Date.now() }),
      });

      if (!response.ok) throw new Error('Order failed');
      const data = await response.json();
      this.logger.info('Pizza ordered', { pizzaType, size });
      return data;
    } catch (error) {
      this.logger.error('Pizza order failed', { error });
      throw error;
    }
  }

  /**
   * LinkedIn profile update tool
   */
  async updateLinkedInProfile(
    field: string,
    value: string,
    context?: ToolExecutionContext,
    permission?: IPermissionLayer
  ): Promise<boolean> {
    if (permission && context?.actorId) {
      const allowed = permission.can(context.actorId, 'social.linkedin');
      if (!allowed) {
        throw new PermissionDeniedError('LinkedIn permission denied', { field });
      }
    }

    try {
      const response = await fetch('http://localhost:3001/api/tools/update-linkedin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field, value, timestamp: Date.now() }),
      });
      return response.ok;
    } catch (error) {
      this.logger.error('LinkedIn update failed', { error });
      return false;
    }
  }

  /**
   * Calendar event creation tool
   */
  async createCalendarEvent(
    title: string,
    startTime: string,
    endTime: string,
    attendees: string[],
    context?: ToolExecutionContext,
    permission?: IPermissionLayer
  ): Promise<{ eventId: string; status: string }> {
    if (permission && context?.actorId) {
      const allowed = permission.can(context.actorId, 'calendar.create');
      if (!allowed) {
        throw new PermissionDeniedError('Calendar permission denied', { title });
      }
    }

    try {
      const response = await fetch('http://localhost:3001/api/tools/create-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, startTime, endTime, attendees, timestamp: Date.now() }),
      });

      if (!response.ok) throw new Error('Event creation failed');
      return await response.json();
    } catch (error) {
      this.logger.error('Calendar event creation failed', { error });
      throw error;
    }
  }

  /**
   * File system operation tool
   */
  async listFiles(
    directory: string,
    context?: ToolExecutionContext,
    permission?: IPermissionLayer
  ): Promise<string[]> {
    if (permission && context?.actorId) {
      const allowed = permission.can(context.actorId, 'filesystem.read');
      if (!allowed) {
        throw new PermissionDeniedError('File system permission denied', { directory });
      }
    }

    try {
      const response = await fetch('http://localhost:3001/api/tools/list-files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ directory }),
      });

      if (!response.ok) throw new Error('File listing failed');
      const data = await response.json();
      return data.files || [];
    } catch (error) {
      this.logger.error('File listing failed', { directory, error });
      return [];
    }
  }
}

export const builtInTools = new BuiltInTools();
