import { prisma } from "../../lib/prisma.js";
import type { CreateApartmentInput } from "./apartments.schemas.js";
import { ApiError } from "../../middleware/error.js";

export async function listApartments() {
  const apartments = await prisma.apartment.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { customers: true },
      },
    },
  });

  return apartments;
}

export async function getApartmentById(id: number) {
  const apartment = await prisma.apartment.findUnique({
    where: { id },
    include: {
      customers: {
        orderBy: { fullName: "asc" },
      },
    },
  });

  if (!apartment) {
    throw new ApiError(404, "Apartment not found");
  }

  return apartment;
}

export async function createApartment(input: CreateApartmentInput) {
  const nameTrimmed = input.name.trim();
  const addressTrimmed = input.address.trim();
  const cityTrimmed = input.city ? input.city.trim() : "Pune";

  // Check for duplicate name & address
  const existing = await prisma.apartment.findFirst({
    where: {
      name: { equals: nameTrimmed, mode: "insensitive" },
      address: { equals: addressTrimmed, mode: "insensitive" },
    },
  });

  if (existing) {
    throw new ApiError(490, "An apartment building with the same name and address already exists");
  }

  const apartment = await prisma.apartment.create({
    data: {
      name: nameTrimmed,
      address: addressTrimmed,
      city: cityTrimmed,
    },
  });

  return apartment;
}

export async function deleteApartment(id: number) {
  const apartment = await prisma.apartment.findUnique({
    where: { id },
  });

  if (!apartment) {
    throw new ApiError(404, "Apartment not found");
  }

  await prisma.apartment.delete({
    where: { id },
  });

  return { success: true };
}
