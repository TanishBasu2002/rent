import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

// Add validation for required credentials
if (!accountSid || !authToken) {
  console.error("Twilio credentials are missing!");
}

// Create client only if credentials are available
const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

/**
 * Formats a UAE phone number to E.164 format.
 * @param {string} phoneNumber - The phone number to format.
 * @returns {string} - The formatted phone number in E.164 format.
 * @throws {Error} - If the phone number is invalid.
 */
const formatUAEPhoneNumber = (phoneNumber) => {
  // Check if phone number is valid
  if (!phoneNumber) {
    throw new Error("Phone number is required");
  }

  // Remove any non-numeric characters
  const cleaned = phoneNumber.replace(/\D/g, "");

  // UAE phone numbers should be 9 digits (without country code)
  // Or 12-13 digits (with +971 or 00971 country code)

  // Check if the number is too short
  if (cleaned.length < 9) {
    throw new Error(
      "Phone number too short (UAE numbers must be at least 9 digits excluding country code)",
    );
  }

  // If the number starts with '00971' (international format with 00)
  if (cleaned.startsWith("00971")) {
    return `+${cleaned.slice(2)}`; // Convert 00971 to +971
  }

  // If the number already starts with '+971', return it as is
  if (cleaned.startsWith("+971")) {
    return cleaned;
  }

  // If the number starts with '971' (without '+')
  if (cleaned.startsWith("971")) {
    return `+${cleaned}`;
  }

  // If the number starts with '0' (UAE local format usually starts with 0)
  if (cleaned.startsWith("0")) {
    return `+971${cleaned.slice(1)}`;
  }

  // Handle mobile numbers without country code or leading zero
  // UAE mobile numbers start with 5 and are 9 digits long
  if (cleaned.length === 9 && cleaned.startsWith("5")) {
    return `+971${cleaned}`;
  }

  // If the number doesn't match any known UAE format, throw an error
  throw new Error("Invalid UAE phone number format");
};

/**
 * Validates if a number is a valid UAE WhatsApp number
 * @param {string} formattedNumber - The E.164 formatted phone number
 * @returns {boolean} - Whether the number is valid for UAE WhatsApp
 */
const isValidUAEWhatsAppNumber = (formattedNumber) => {
  // Remove any non-numeric characters and the plus sign
  const numericOnly = formattedNumber.replace(/[^\d]/g, "");

  // Check if it starts with UAE country code (971)
  if (!numericOnly.startsWith("971")) {
    return false;
  }

  // Check for valid UAE number length (country code + 9 digits)
  if (numericOnly.length !== 12) {
    return false;
  }

  // UAE mobile numbers start with 5 after the country code
  // Only mobile numbers can use WhatsApp
  if (numericOnly.charAt(3) !== "5") {
    return false;
  }

  return true;
};

/**
 * Sends a WhatsApp message using Twilio.
 * @param {string} to - The recipient's phone number.
 * @param {string|object} body - The message body or template variables.
 * @param {boolean} useTemplate - Whether to use a template message (for outside 24h window).
 * @param {string} templateName - The name of the template to use (if useTemplate is true).
 * @returns {Promise<twilio.messages.MessageInstance>} - The Twilio message instance.
 * @throws {Error} - If the Twilio client is not initialized or if the phone number is invalid.
 */
export const sendWhatsAppMessage = async (
  to,
  body,
  useTemplate = false,
  templateName = null,
) => {
  try {
    if (!client) {
      throw new Error(
        "Twilio client not initialized due to missing credentials",
      );
    }

    if (!to || !body) {
      throw new Error('Both "to" phone number and message body are required');
    }

    // Format the 'to' phone number to E.164 format
    const formattedTo = formatUAEPhoneNumber(to);

    // Additional validation for WhatsApp-enabled numbers
    if (!isValidUAEWhatsAppNumber(formattedTo)) {
      throw new Error(
        "Invalid UAE WhatsApp number. Must be a mobile number starting with +9715 and 9 digits long after country code.",
      );
    }

    const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;
    if (!whatsappNumber) {
      throw new Error("Twilio WhatsApp number not configured");
    }

    // Prepare message options
    const messageOptions = {
      to: `whatsapp:${formattedTo}`,
      from: `whatsapp:${whatsappNumber}`,
    };

    // Handle template messages for outside 24-hour window
    if (useTemplate && templateName) {
      // Check if template exists in environment variables
      const templateSid =
        process.env[`TWILIO_TEMPLATE_${templateName.toUpperCase()}`];
      if (!templateSid) {
        throw new Error(
          `Template "${templateName}" not found in environment variables`,
        );
      }

      messageOptions.contentSid = templateSid;
      // For templates, the body parameter contains the template variables
      messageOptions.contentVariables = JSON.stringify(body);
    } else {
      // Regular message within 24-hour window
      messageOptions.body = body;
    }

    // Send the message and await the result
    const message = await client.messages.create(messageOptions);
    console.log("WhatsApp message sent with SID:", message.sid);
    return message;
  } catch (error) {
    // Check for specific Twilio errors related to messaging window
    if (
      error.code === 63001 ||
      (error.message && error.message.includes("outside the allowed window"))
    ) {
      console.error(
        "Error: Message failed - outside 24-hour messaging window. Use a template message instead.",
      );
      throw new Error(
        "WhatsApp messaging window expired. Use a template message for this recipient.",
      );
    }

    console.error("Error sending WhatsApp message:", error);
    throw error;
  }
};
