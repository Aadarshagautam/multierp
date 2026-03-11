import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { ConnectDB } from "../core/config/db.js";
import CustomerModel from "../shared/customers/model.js";
import LegacyPosCustomerModel from "../shared/customers/legacy-pos-model.js";
import {
  computeCustomerTier,
  mapLegacyPosCustomerToShared,
  normalizeCustomerPayload,
  normalizePhoneDigits,
} from "../shared/customers/utils.js";

const buildNormalizedSharedDocument = (rawCustomer = {}) => {
  const normalized = normalizeCustomerPayload(
    {
      ...rawCustomer,
      taxNumber: rawCustomer.taxNumber || rawCustomer.gstin || "",
      customerType: rawCustomer.customerType || "regular",
      creditLimit: rawCustomer.creditLimit ?? null,
      creditBalance: rawCustomer.creditBalance ?? 0,
      loyaltyPoints: rawCustomer.loyaltyPoints ?? 0,
      totalSpent: rawCustomer.totalSpent ?? 0,
      visitCount: rawCustomer.visitCount ?? 0,
      notes: rawCustomer.notes || "",
      tags: rawCustomer.tags || [],
      isActive: rawCustomer.isActive ?? true,
      branchId: rawCustomer.branchId || null,
      birthday: rawCustomer.birthday || "",
      company: rawCustomer.company || "",
      source: rawCustomer.source || "legacy_customer",
    },
    { partial: false }
  );

  return {
    name: normalized.name,
    userId: rawCustomer.userId,
    orgId: rawCustomer.orgId || null,
    branchId: rawCustomer.branchId || null,
    legacyPosCustomerId: rawCustomer.legacyPosCustomerId || null,
    email: normalized.email,
    phone: normalized.phone,
    phoneDigits: normalizePhoneDigits(normalized.phone),
    company: normalized.company,
    address: normalized.address,
    taxNumber: normalized.taxNumber,
    customerType: normalized.customerType || "regular",
    creditLimit: normalized.creditLimit ?? null,
    creditBalance: rawCustomer.creditBalance ?? 0,
    loyaltyPoints: rawCustomer.loyaltyPoints ?? 0,
    totalSpent: rawCustomer.totalSpent ?? 0,
    visitCount: rawCustomer.visitCount ?? 0,
    tier: computeCustomerTier(rawCustomer.totalSpent ?? 0),
    birthday: normalized.birthday,
    notes: normalized.notes,
    tags: normalized.tags,
    isActive: rawCustomer.isActive ?? true,
    createdBy: rawCustomer.createdBy || rawCustomer.userId || null,
    updatedBy: rawCustomer.updatedBy || rawCustomer.userId || null,
    lastSaleAt: rawCustomer.lastSaleAt || null,
    source: rawCustomer.source || "legacy_customer",
  };
};

const buildNormalizedLegacyPosDocument = (legacyCustomer = {}) => {
  const mapped = mapLegacyPosCustomerToShared(legacyCustomer);

  return {
    name: mapped.name,
    userId: mapped.userId,
    orgId: mapped.orgId || null,
    branchId: mapped.branchId || null,
    legacyPosCustomerId: mapped.legacyPosCustomerId || legacyCustomer._id,
    email: mapped.email,
    phone: mapped.phone,
    phoneDigits: normalizePhoneDigits(mapped.phone),
    company: mapped.company || "",
    address: mapped.address,
    taxNumber: mapped.taxNumber,
    customerType: mapped.customerType || "regular",
    creditLimit: mapped.creditLimit ?? null,
    creditBalance: mapped.creditBalance ?? 0,
    loyaltyPoints: mapped.loyaltyPoints ?? 0,
    totalSpent: mapped.totalSpent ?? 0,
    visitCount: mapped.visitCount ?? 0,
    tier: computeCustomerTier(mapped.totalSpent ?? 0),
    birthday: mapped.birthday || "",
    notes: mapped.notes || "",
    tags: mapped.tags || [],
    isActive: mapped.isActive ?? true,
    createdBy: mapped.createdBy || mapped.userId || null,
    updatedBy: mapped.updatedBy || mapped.userId || null,
    lastSaleAt: mapped.lastSaleAt || null,
    source: "legacy_pos",
  };
};

async function migrateCustomersToShared() {
  await ConnectDB();

  const sharedCollection = CustomerModel.collection;
  const currentSharedCustomers = await sharedCollection.find({}).toArray();
  const legacyPosCustomers = await LegacyPosCustomerModel.find({}).lean();

  console.log(`Normalizing ${currentSharedCustomers.length} existing shared customers...`);
  if (currentSharedCustomers.length > 0) {
    await sharedCollection.bulkWrite(
      currentSharedCustomers.map((rawCustomer) => ({
        updateOne: {
          filter: { _id: rawCustomer._id },
          update: {
            $set: {
              ...buildNormalizedSharedDocument(rawCustomer),
              updatedAt: rawCustomer.updatedAt || new Date(),
            },
          },
        },
      }))
    );
  }

  console.log(`Migrating ${legacyPosCustomers.length} legacy POS customers into the shared collection...`);
  if (legacyPosCustomers.length > 0) {
    await sharedCollection.bulkWrite(
      legacyPosCustomers.map((legacyCustomer) => ({
        updateOne: {
          filter: { _id: legacyCustomer._id },
          update: {
            $setOnInsert: {
              createdAt: legacyCustomer.createdAt || new Date(),
            },
            $set: {
              ...buildNormalizedLegacyPosDocument(legacyCustomer),
              updatedAt: legacyCustomer.updatedAt || new Date(),
            },
          },
          upsert: true,
        },
      }))
    );
  }

  console.log("Customer migration complete.");
  await mongoose.disconnect();
  process.exit(0);
}

migrateCustomersToShared().catch((error) => {
  console.error("Customer migration failed:", error);
  process.exit(1);
});
