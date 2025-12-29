import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import functions from "firebase-functions";

/**
 * Email service for sending invitation and notification emails
 *
 * Configuration:
 * - Uses Gmail SMTP by default (requires app password)
 * - Set environment variables:
 *   firebase functions:config:set email.user="your-email@gmail.com"
 *   firebase functions:config:set email.password="your-app-password"
 *
 * For Gmail app password:
 * 1. Go to Google Account settings
 * 2. Security > 2-Step Verification
 * 3. App passwords > Generate new password
 */

// Create reusable transporter
let transporter: Transporter | null = null;

const getTransporter = (): Transporter => {
  if (transporter) return transporter;

  // Get email config from Firebase functions config
  const emailConfig = functions.config().email;

  if (!emailConfig?.user || !emailConfig?.password) {
    functions.logger.warn(
      "Email configuration not found. Set with: firebase functions:config:set email.user=... email.password=..."
    );
    // For development/testing, create test account
    throw new Error("Email service not configured");
  }

  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: emailConfig.user,
      pass: emailConfig.password,
    },
  });

  return transporter;
};

interface InvitationEmailData {
  recipientEmail: string;
  recipientName?: string;
  professionalName: string;
  role: string;
  token: string;
  expiresAt: Date;
}

/**
 * Send invitation email to a collaborator
 */
export const sendInvitationEmail = async (
  data: InvitationEmailData
): Promise<boolean> => {
  try {
    const transport = getTransporter();

    const acceptUrl = `${process.env.APP_URL || "http://localhost:5173"}/accept-invitation?token=${data.token}`;

    const expiryDate = data.expiresAt.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    const roleTranslation: Record<string, string> = {
      COLLABORATOR: "Colaborador",
      SECRETARY: "Secretária",
      MARKETING: "Marketing",
      FINANCES: "Financeiro",
      ADMIN: "Administrador",
    };

    const roleName = roleTranslation[data.role] || data.role;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background-color: #f9fafb;
            border-radius: 8px;
            padding: 30px;
            border: 1px solid #e5e7eb;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .header h1 {
            color: #059669;
            margin: 0;
            font-size: 24px;
          }
          .content {
            background-color: white;
            padding: 25px;
            border-radius: 6px;
            margin-bottom: 20px;
          }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #059669;
            color: white !important;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            text-align: center;
            margin: 20px 0;
          }
          .button:hover {
            background-color: #047857;
          }
          .info-box {
            background-color: #f0fdf4;
            border-left: 4px solid #059669;
            padding: 15px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            color: #6b7280;
            font-size: 14px;
            margin-top: 20px;
          }
          .token {
            font-family: monospace;
            background-color: #f3f4f6;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏥 NutriOffice</h1>
          </div>

          <div class="content">
            <h2>Convite para Colaboração</h2>

            <p>Olá${data.recipientName ? ` ${data.recipientName}` : ""},</p>

            <p>
              <strong>${data.professionalName}</strong> convidou você para colaborar
              na plataforma <strong>NutriOffice</strong> com a função de <strong>${roleName}</strong>.
            </p>

            <div class="info-box">
              <p style="margin: 0;"><strong>Função:</strong> ${roleName}</p>
              <p style="margin: 10px 0 0 0;"><strong>Convite válido até:</strong> ${expiryDate}</p>
            </div>

            <p>Para aceitar este convite e criar sua conta, clique no botão abaixo:</p>

            <div style="text-align: center;">
              <a href="${acceptUrl}" class="button">Aceitar Convite</a>
            </div>

            <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
              Caso o botão não funcione, copie e cole o seguinte link no seu navegador:<br>
              <a href="${acceptUrl}" style="color: #059669; word-break: break-all;">${acceptUrl}</a>
            </p>

            <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
              Se você não esperava este convite, pode ignorar este e-mail com segurança.
            </p>
          </div>

          <div class="footer">
            <p>Este é um e-mail automático, por favor não responda.</p>
            <p>© ${new Date().getFullYear()} NutriOffice - Sistema de Gestão Nutricional</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
Convite para Colaboração - NutriOffice

Olá${data.recipientName ? ` ${data.recipientName}` : ""},

${data.professionalName} convidou você para colaborar na plataforma NutriOffice com a função de ${roleName}.

Função: ${roleName}
Convite válido até: ${expiryDate}

Para aceitar este convite e criar sua conta, acesse o link abaixo:
${acceptUrl}

Se você não esperava este convite, pode ignorar este e-mail com segurança.

---
Este é um e-mail automático, por favor não responda.
© ${new Date().getFullYear()} NutriOffice - Sistema de Gestão Nutricional
    `;

    const emailConfig = functions.config().email;
    const info = await transport.sendMail({
      from: {
        name: "NutriOffice",
        address: emailConfig?.user || "noreply@nutrioffice.com",
      },
      to: data.recipientEmail,
      subject: `Convite para colaborar no NutriOffice - ${roleName}`,
      text: textContent,
      html: htmlContent,
    });

    functions.logger.info(`Invitation email sent successfully: ${info.messageId}`);
    return true;
  } catch (error) {
    functions.logger.error("Error sending invitation email:", error);
    return false;
  }
};

interface FormSubmissionEmailData {
  recipientEmail: string;
  professionalName: string;
  customerName: string;
  appointmentType: string;
  submittedAt: Date;
  submissionUrl: string;
}

/**
 * Send email notification when a new form submission is received
 */
export const sendFormSubmissionEmail = async (
  data: FormSubmissionEmailData
): Promise<boolean> => {
  try {
    const transport = getTransporter();

    const submissionDate = data.submittedAt.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const appointmentTypeLabel = data.appointmentType === "online" ? "Online" : "Presencial";

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background-color: #f9fafb;
            border-radius: 8px;
            padding: 30px;
            border: 1px solid #e5e7eb;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .header h1 {
            color: #059669;
            margin: 0;
            font-size: 24px;
          }
          .content {
            background-color: white;
            padding: 25px;
            border-radius: 6px;
            margin-bottom: 20px;
          }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #059669;
            color: white !important;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            text-align: center;
            margin: 20px 0;
          }
          .button:hover {
            background-color: #047857;
          }
          .info-box {
            background-color: #f0fdf4;
            border-left: 4px solid #059669;
            padding: 15px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            color: #6b7280;
            font-size: 14px;
            margin-top: 20px;
          }
          .badge {
            display: inline-block;
            padding: 4px 12px;
            background-color: #059669;
            color: white;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏥 NutriOffice</h1>
          </div>

          <div class="content">
            <h2>📋 Nova Submissão de Formulário</h2>

            <p>Olá <strong>${data.professionalName}</strong>,</p>

            <p>
              Você recebeu uma nova submissão de formulário de anamnese pública.
            </p>

            <div class="info-box">
              <p style="margin: 0;"><strong>Cliente:</strong> ${data.customerName}</p>
              <p style="margin: 10px 0 0 0;"><strong>Tipo de Consulta:</strong> <span class="badge">${appointmentTypeLabel}</span></p>
              <p style="margin: 10px 0 0 0;"><strong>Data de Envio:</strong> ${submissionDate}</p>
            </div>

            <p>Acesse o sistema para revisar os dados e aprovar ou rejeitar esta submissão:</p>

            <div style="text-align: center;">
              <a href="${data.submissionUrl}" class="button">Ver Submissões Pendentes</a>
            </div>

            <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
              Caso o botão não funcione, copie e cole o seguinte link no seu navegador:<br>
              <a href="${data.submissionUrl}" style="color: #059669; word-break: break-all;">${data.submissionUrl}</a>
            </p>
          </div>

          <div class="footer">
            <p>Este é um e-mail automático, por favor não responda.</p>
            <p>© ${new Date().getFullYear()} NutriOffice - Sistema de Gestão Nutricional</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
Nova Submissão de Formulário - NutriOffice

Olá ${data.professionalName},

Você recebeu uma nova submissão de formulário de anamnese pública.

Cliente: ${data.customerName}
Tipo de Consulta: ${appointmentTypeLabel}
Data de Envio: ${submissionDate}

Acesse o sistema para revisar os dados e aprovar ou rejeitar esta submissão:
${data.submissionUrl}

---
Este é um e-mail automático, por favor não responda.
© ${new Date().getFullYear()} NutriOffice - Sistema de Gestão Nutricional
    `;

    const emailConfig = functions.config().email;
    const info = await transport.sendMail({
      from: {
        name: "NutriOffice",
        address: emailConfig?.user || "noreply@nutrioffice.com",
      },
      to: data.recipientEmail,
      subject: `Nova Submissão de Formulário - ${data.customerName}`,
      text: textContent,
      html: htmlContent,
    });

    functions.logger.info(`Form submission email sent successfully: ${info.messageId}`);
    return true;
  } catch (error) {
    functions.logger.error("Error sending form submission email:", error);
    return false;
  }
};

/**
 * Send test email to verify configuration
 */
export const sendTestEmail = async (recipientEmail: string): Promise<boolean> => {
  try {
    const transport = getTransporter();
    const emailConfig = functions.config().email;

    const info = await transport.sendMail({
      from: {
        name: "NutriOffice",
        address: emailConfig?.user || "noreply@nutrioffice.com",
      },
      to: recipientEmail,
      subject: "Teste de Configuração de E-mail - NutriOffice",
      text: "Se você está recebendo este e-mail, a configuração do serviço de e-mail está funcionando corretamente!",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #059669;">✅ Configuração de E-mail Funcionando!</h2>
          <p>Se você está recebendo este e-mail, o serviço de e-mail do NutriOffice está configurado corretamente.</p>
        </div>
      `,
    });

    functions.logger.info(`Test email sent successfully: ${info.messageId}`);
    return true;
  } catch (error) {
    functions.logger.error("Error sending test email:", error);
    return false;
  }
};
