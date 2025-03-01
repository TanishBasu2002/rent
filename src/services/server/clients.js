import prisma from "@/lib/prisma";
import {updateWhereClauseWithUserProperties} from "@/app/api/utlis/userProperties"; // Adjust the path to your Prisma instance

export async function createRenter(data) {
    const extraData = data.extraData;
    const bankAccounts = extraData?.bankAccounts || [];

    delete data.extraData;
    const newRenter = await prisma.client.create({
        data: {
            ...data,
            role: "RENTER",
        },
        include: {
            bankAccounts: true,
        },
    });
    if (bankAccounts.length > 0) {
        await prisma.bankAccount.createMany({
            data: bankAccounts.map((account) => ({
                accountNumber: account.accountNumber,
                accountName: account.accountName,
                bankName: account.bankName,
                bankId: account.bankId,
                clientId: newRenter.id,
            })),
        });
    }
    return newRenter;
}

export async function getRenters(page, limit) {
    const offset = (page - 1) * limit;
    let where = {role: "RENTER"}
    let unit = {}
    unit = await updateWhereClauseWithUserProperties("propertyId", unit)
    where.units = {some: unit};
    const renters = await prisma.client.findMany({
        where,
        skip: offset,
        take: limit,
        include: {
            bankAccounts: true,
        },
    });
    const totalRenters = await prisma.client.count({where});
    const totalPages = Math.ceil(totalRenters / limit);

    return {
        data: renters,
        totalPages,
        total: totalRenters,
    };
}

export async function updateRenter(id, data) {
    const extraData = data.extraData;
    const bankAccounts = extraData?.bankAccounts || [];
    if (bankAccounts.length > 0) {
        bankAccounts.forEach((account) => {
            delete account.uniqueId;
        });
    }
    delete data.extraData;
    await prisma.bankAccount.deleteMany({
        where: {
            clientId: id,
        },
    });
    if (bankAccounts.length > 0) {
        await prisma.bankAccount.createMany({
            data: bankAccounts.map((account) => ({
                ...account,
                clientId: id,
            })),
        });
    }
    const updatedRenter = await prisma.client.update({
        where: {id},
        data: {
            ...data,
        },
        include: {
            bankAccounts: true,
        },
    });
    return updatedRenter;
}

export async function getRenterById(page, limit, searchParams, params) {
    const id = params.id;
    const renter = await prisma.client.findUnique({
        where: {id: +id},
        include: {
            bankAccounts: true,
        },
    });
    return renter;
}

export async function deleteRenter(id) {
    return await prisma.client.delete({
        where: {id},
    });
}

export async function createOwner(data) {
    // Validate input data
    if (!data) {
        throw new Error("Invalid input: Data is required");
    }

    const extraData = data.extraData || {};
    const bankAccounts = extraData.bankAccounts || [];

    // Remove extraData from the main data object
    delete data.extraData;

    try {
        // Use a Prisma transaction to ensure atomicity
        const newOwner = await prisma.$transaction(async (prisma) => {
            // Create the owner
            const owner = await prisma.client.create({
                data: {
                    ...data,
                    role: "OWNER",
                },
                include: {
                    bankAccounts: true,
                },
            });

            // Create bank accounts if they exist
            if (bankAccounts.length > 0) {
                await prisma.bankAccount.createMany({
                    data: bankAccounts.map((account) => ({
                        accountNumber: account.accountNumber,
                        accountName: account.accountName,
                        bankName: account.bankName,
                        bankId: account.bankId,
                        clientId: owner.id, // Link to the newly created owner
                    })),
                });
            }

            // Fetch the owner with their bank accounts
            return prisma.client.findUnique({
                where: { id: owner.id },
                include: { bankAccounts: true },
            });
        });

        return newOwner;
    } catch (error) {
        console.error("Error creating owner:", error);
        throw new Error("Failed to create owner: " + error.message);
    }
}

export async function getOwners(page, limit) {
    const offset = (page - 1) * limit;
    let where = {role: "OWNER"}
    let some = {}
    some = await updateWhereClauseWithUserProperties("id", some)
    where.properties = {some};
    const owners = await prisma.client.findMany({
        where,
        skip: offset,
        take: limit,
        include: {
            bankAccounts: true,
        },
    });
    const totalOwners = await prisma.client.count({where});
    const totalPages = Math.ceil(totalOwners / limit);

    return {
        data: owners,
        totalPages,
        total: totalOwners,
    };
}

export async function updateOwner(id, data) {
    const extraData = data.extraData;
    const newBankAccounts = extraData?.bankAccounts || [];
    newBankAccounts.forEach(account => {
        delete account.uniqueId; // Remove the uniqueId from the bank account
    });

    // Fetch existing bank accounts associated with the client
    const existingBankAccounts = await prisma.bankAccount.findMany({
        where: {
            clientId: id,
        },
    });

    // Delete bank accounts that are in the old data but not in the new incoming data
    const accountsToDelete = existingBankAccounts.filter((existingAccount) =>
          !newBankAccounts.some((newAccount) =>
                newAccount.id === existingAccount.id // Match by bankId
          )
    );

    if (accountsToDelete.length > 0) {
        await prisma.bankAccount.deleteMany({
            where: {
                id: {in: accountsToDelete.map(acc => acc.id)},
            },
        });
    }

    // Update existing accounts that are in both old and new data
    const accountsToUpdate = newBankAccounts.filter((newAccount) =>
          existingBankAccounts.some((existingAccount) =>
                newAccount.id === existingAccount.id // Match by bankId
          )
    );

    for (const account of accountsToUpdate) {
        const existingAccount = existingBankAccounts.find(
              (acc) => acc.id === account.id
        );
        await prisma.bankAccount.update({
            where: {id: existingAccount.id},
            data: {
                accountName: account.accountName,
                accountNumber: account.accountNumber, // Update accountNumber and other fields
            },
        });
    }

    // Create new accounts that are in the new data but not in the old data
    const accountsToInsert = newBankAccounts.filter((newAccount) =>
          !newAccount.id
    );

    if (accountsToInsert.length > 0) {
        await prisma.bankAccount.createMany({
            data: accountsToInsert.map((account) => ({
                ...account,
                clientId: id,
            })),
        });
    }

    delete data.extraData;
    const updatedOwner = await prisma.client.update({
        where: {id},
        data: {
            ...data,
        },
        include: {
            bankAccounts: true,
        },
    });
    return updatedOwner;
}

export async function getOwnerById(page, limit, searchParams, params) {
    const id = params.id;
    const owner = await prisma.client.findUnique({
        where: {id: +id},
        include: {
            bankAccounts: true,
        },
    });
    return owner;
}

export async function deleteOwner(id) {
    return await prisma.client.delete({
        where: {id},
    });
}

export async function getClients() {
    const clients = await prisma.client.findMany();
    return {
        data: clients,
    };
}
