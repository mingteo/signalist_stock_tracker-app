import nodemailer from "nodemailer";
import { WELCOME_EMAIL_TEMPLATE } from "./templates";

// Add interface for news articles
interface NewsArticle {
  url: string;
  headline: string;
  summary: string;
  datetime: number;
}

interface NewsEmailParams {
  to: string;
  news: NewsArticle[];
  summary: string;
}

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.NODEMAILER_EMAIL!,
    pass: process.env.NODEMAILER_PASSWORD!,
  },
});

export const sendWelcomeEmail = async ({
  email,
  name,
  intro,
}: WelcomeEmailData) => {
  const htmlTemplate = WELCOME_EMAIL_TEMPLATE.replace("{{name}}", name).replace(
    "{{intro}}",
    intro,
  );
  const mailOptions = {
    from: `"Signalist" <signalist@gmail.com>`,
    to: email,
    subject: `Welcome to Signalist - your stock market toolkit is ready!`,
    text: "Thanks for joining Signalist",
    html: htmlTemplate,
  };

  await transporter.sendMail(mailOptions);
};

export async function sendNewsEmail({ to, news, summary }: NewsEmailParams) {
  const emailContent = `
    <h2>Your Daily Market News Summary</h2>
    <div>${summary}</div>
    <h3>Today's Headlines:</h3>
    <ul>
      ${news
        .map(
          (article) => `
        <li>
          <a href="${article.url}">${article.headline}</a>
          <p>${article.summary}</p>
        </li>`,
        )
        .join("")}
    </ul>
  `;

  // Use the existing transporter instead of creating a new one
  return transporter.sendMail({
    from: `"Signalist" <signalist@gmail.com>`,
    to,
    subject: "Your Daily Stock Market News Summary",
    html: emailContent,
  });
}
