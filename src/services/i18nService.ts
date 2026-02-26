
import { Language } from '../types';

export const TRANSLATIONS = {
  [Language.ES]: {
    nav: {
      dashboard: 'Inicio',
      members: 'Socios',
      treasury: 'Tesorería',
      board: 'Directiva',
      assemblies: 'Asambleas',
      attendance: 'Asistencia',
      settings: 'Configuración',
      support: 'Usuarios',
      logout: 'Salir'
    },
    dashboard: {
      welcome: 'Hola',
      subtitle: 'Panel central de gestión institucional',
      kpiMembers: 'Censo Social',
      kpiCash: 'Caja Neta',
      kpiIncome: 'Histórico Ingresos',
      kpiSessions: 'Sesiones',
      aiSummary: 'Resumen Inteligente',
      nextAssembly: 'Citación Pendiente'
    },
    common: {
      save: 'Guardar',
      cancel: 'Cancelar',
      edit: 'Editar',
      delete: 'Eliminar',
      search: 'Buscar...',
      loading: 'Cargando...'
    }
  },
  [Language.EN]: {
    nav: {
      dashboard: 'Dashboard',
      members: 'Members',
      treasury: 'Treasury',
      board: 'Board',
      assemblies: 'Assemblies',
      attendance: 'Attendance',
      settings: 'Settings',
      support: 'Users',
      logout: 'Logout'
    },
    dashboard: {
      welcome: 'Hello',
      subtitle: 'Institutional central management panel',
      kpiMembers: 'Social Census',
      kpiCash: 'Net Cash',
      kpiIncome: 'Total Income',
      kpiSessions: 'Sessions',
      aiSummary: 'Smart Summary',
      nextAssembly: 'Pending Assembly'
    },
    common: {
      save: 'Save',
      cancel: 'Cancel',
      edit: 'Edit',
      delete: 'Delete',
      search: 'Search...',
      loading: 'Loading...'
    }
  }
};

export const getTranslation = (lang: Language = Language.ES) => {
  return TRANSLATIONS[lang] || TRANSLATIONS[Language.ES];
};
