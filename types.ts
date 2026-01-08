
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

export interface BoardPosition {
  role: BoardRole;
  primary: {
    name: string;
    rut: string;
    phone: string;
  };
  substitute: {
    name: string;
    rut: string;
    phone: string;
  };
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
  password?: string; // Solo para validación local simple
  role: SystemRole;
  name: string;
  lastLogin?: string;
}
