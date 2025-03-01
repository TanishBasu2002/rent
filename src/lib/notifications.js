export async function sendNotifications(rentAgreement) {
    // Validate required fields
    if (!rentAgreement.renter.name || !rentAgreement.renter.phone || !rentAgreement.renter.email) {
        throw new Error('Missing required fields: renter name, phone, or email');
    }

    const notificationData = {
        renterName: rentAgreement.renter.name,
        renterEmail: rentAgreement.renter.email,
        renterPhone: rentAgreement.renter.phone,
        unitNumber: rentAgreement.unit.number,
        propertyName: rentAgreement.unit.property.name,
        startDate: rentAgreement.startDate,
        endDate: rentAgreement.endDate,
        totalContractPrice: rentAgreement.totalContractPrice,
        rentCollectionType: rentAgreement.rentCollectionType
    };

    const notifications = [];
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    if (rentAgreement.renter.email) {
        notifications.push(
            fetch(`${baseUrl}/api/notifications/email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(notificationData)
            })
            .then(response => {
                if (!response.ok) {
                    console.error('Email notification failed:', response.statusText);
                } else {
                    console.log('Email notification sent successfully');
                }
            })
            .catch(error => console.error('Failed to send email notification:', error))
        );
    }

    if (rentAgreement.renter.phone) {
        const templateVariables = {
            1: rentAgreement.renter.name // اسم المستأجر
        };

        notifications.push(
            fetch(`${baseUrl}/api/notifications/whatsapp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    renterPhone: rentAgreement.renter.phone,
                    renterName: rentAgreement.renter.name, // Ensure renterName is included
                    templateName: 'rent_aggrement_creation',
                    templateVariables: templateVariables
                })
            })
            .then(response => {
                if (!response.ok) {
                    console.error('WhatsApp notification failed:', response.statusText);
                } else {
                    console.log('WhatsApp notification sent successfully');
                }
            })
            .catch(error => console.error('Failed to send WhatsApp notification:', error))
        );
    }

    // Execute all notifications in parallel and return results
    const results = await Promise.allSettled(notifications);
    return results.map(result => {
        if (result.status === 'fulfilled') {
            return { success: true, response: result.value };
        } else {
            return { success: false, error: result.reason };
        }
    });
}