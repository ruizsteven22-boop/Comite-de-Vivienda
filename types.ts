
export enum Language {
  ES = 'es',
  EN = 'en'
}

export enum MemberStatus {
  ACTIVE = 'Activo',
  INACTIVE = 'Inactivo',
  PENDING = 'Pendiente',
  SUSPENDED = 'Suspendido'
}

export enum BoardRole {
  PRESIDENT = 'Presidente',
  SECRETARY = 'Secretario',
  TREASURER = 'Tesorero'
}

export type SystemRole = BoardRole | 'SUPPORT' | 'ADMINISTRATOR';

export enum TransactionType {
  INCOME = 'Ingreso',
  EXPENSE = 'Egreso'
}

export enum PaymentMethod {
  CASH = 'Efectivo',
  TRANSFER = 'Transferencia'
}

export enum AssemblyType {
  ORDINARY = 'Ordinaria',
  EXTRAORDINARY = 'Extraordinaria'
}

export enum AssemblyStatus {
  SCHEDULED = 'Programada',
  IN_PROGRESS = 'En Curso',
  FINISHED = 'Finalizada'
}

export enum DocumentType {
  REPORT = 'Informe',
  MEMO = 'Memorándum',
  CERTIFICATE = 'Certificado',
  LETTER = 'Carta',
  OFFICE = 'Oficio'
}

export enum DocumentStatus {
  DRAFT = 'Borrador',
  SIGNED = 'Firmado',
  SENT = 'Enviado',
  ARCHIVED = 'Archivado'
}

export interface CommitteeConfig {
  legalName: string;
  tradeName: string;
  rut: string;
  email: string;
  phone: string;
  municipalRes: string;
  legalRes: string;
  language?: Language;
  logoUrl?: string;
}

export interface FamilyMember {
  id: string;
  name: string;
  rut: string;
  relationship: string;
}

export interface Member {
  id: string;
  rut: string;
  name: string;
  joinDate: string;
  status: MemberStatus;
  photoUrl?: string;
  email: string;
  address: string;
  comuna: string;
  region: string;
  phone: string;
  familyMembers: FamilyMember[];
}

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  type: TransactionType;
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  description: string;
  memberId?: string;
}

export interface DocumentLog {
  editorName: string;
  timestamp: string;
  action: string;
  statusAtTime: DocumentStatus;
}

export interface Document {
  id: string;
  folioNumber: number;
  year: number;
  type: DocumentType;
  title: string;
  date: string;
  addressee: string;
  subject: string;
  content: string;
  status: DocumentStatus;
  referenceNumber?: string;
  lastUpdate: string;
  history: DocumentLog[];
}

export interface Person {
  name: string;
  rut: string;
  phone: string;
}

export interface BoardPosition {
  role: BoardRole;
  primary: Person;
  substitute: Person;
}

export interface Assembly {
  id: string;
  date: string;
  summonsTime: string;
  location: string;
  description: string;
  attendees: string[];
  type: AssemblyType;
  status: AssemblyStatus;
  startTime?: string;
  agenda?: string[];
  agreements?: string[];
  observations?: string;
}

export interface User {
  id: string;
  username: string;
  password?: string;
  role: SystemRole;
  name: string;
  lastLogin?: string;
}
