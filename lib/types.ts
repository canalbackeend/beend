export type UserRole = 'ADMIN' | 'USER';

export type CampaignType = 'SMILE' | 'NPS' | 'MULTIPLE_CHOICE';

export type CampaignStatus = 'ACTIVE' | 'INACTIVE';

export type QuestionType = 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'SCALE';

export interface User {
  id: string;
  email: string;
  emailVerified?: Date | null;
  password?: string | null;
  name?: string | null;
  image?: string | null;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface Campaign {
  id: string;
  title: string;
  description?: string | null;
  type: CampaignType;
  status: CampaignStatus;
  uniqueLink: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Question {
  id: string;
  text: string;
  order: number;
  type: QuestionType;
  campaignId: string;
  scaleMin?: number | null;
  scaleMax?: number | null;
  scaleMinLabel?: string | null;
  scaleMaxLabel?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuestionOption {
  id: string;
  text: string;
  order: number;
  questionId: string;
  createdAt: Date;
}

export interface Response {
  id: string;
  campaignId: string;
  respondentEmail?: string | null;
  createdAt: Date;
}

export interface Answer {
  id: string;
  responseId: string;
  questionId: string;
  rating?: number | null;
  selectedOptions: string[];
  comment?: string | null;
  createdAt: Date;
}
