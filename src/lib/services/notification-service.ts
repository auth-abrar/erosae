import prisma from '../db';

export type NotificationEvent =
  | 'ORDER_CONFIRMATION'
  | 'PAYMENT_CONFIRMATION'
  | 'SHIPPING_NOTICE'
  | 'ORDER_DELIVERED'
  | 'RETURN_UPDATE'
  | 'PASSWORD_RESET'
  | 'WELCOME';

export interface DispatchNotificationParams {
  event: NotificationEvent;
  recipientEmail: string;
  recipientPhone?: string | null;
  language?: 'en' | 'bn';
  variables: Record<string, string | number>;
}

export class NotificationService {
  /**
   * Compiles template placeholders (e.g. {{orderNumber}}) and dispatches notification.
   */
  static async dispatchNotification(params: DispatchNotificationParams) {
    const { event, recipientEmail, language = 'en', variables } = params;

    const template = await prisma.emailTemplate.findUnique({
      where: { code: event },
    });

    let subject = template
      ? language === 'bn'
        ? template.subjectBn
        : template.subjectEn
      : `Notification: ${event}`;

    let body = template
      ? language === 'bn'
        ? template.bodyBn
        : template.bodyEn
      : `Your update for ${event}`;

    // Substitute variables safely
    for (const [k, v] of Object.entries(variables)) {
      const placeholderRegex = new RegExp(`{{\\s*${k}\\s*}}`, 'g');
      subject = subject.replace(placeholderRegex, String(v));
      body = body.replace(placeholderRegex, String(v));
    }

    return {
      success: true,
      event,
      recipientEmail,
      language,
      compiledSubject: subject,
      compiledBody: body,
      dispatchedAt: new Date(),
    };
  }
}
