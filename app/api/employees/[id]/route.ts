import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, email, photoUrl, isActive } = await req.json();

    // Verificar se o colaborador pertence ao usuário
    const existingEmployee = await prisma.employee.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!existingEmployee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    const employee = await prisma.employee.update({
      where: { id: params.id },
      data: {
        name: name?.trim() || existingEmployee.name,
        email: email?.trim() || null,
        photoUrl: photoUrl?.trim() || null,
        isActive: isActive !== undefined ? isActive : existingEmployee.isActive,
      },
    });

    return NextResponse.json(employee);
  } catch (error) {
    console.error('Error updating employee:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verificar se o colaborador pertence ao usuário
    const existingEmployee = await prisma.employee.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!existingEmployee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Soft delete - apenas desativar
    await prisma.employee.update({
      where: { id: params.id },
      data: { isActive: false },
    });

    return NextResponse.json({ message: 'Employee deactivated successfully' });
  } catch (error) {
    console.error('Error deleting employee:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}