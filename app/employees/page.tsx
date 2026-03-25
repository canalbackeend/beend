import { Metadata } from 'next';
import { EmployeesContent } from './_components/employees-content';

export const metadata: Metadata = {
  title: 'Colaboradores | Pesquisa de Satisfação',
  description: 'Gerencie os colaboradores da sua equipe',
};

export default function EmployeesPage() {
  return <EmployeesContent />;
}