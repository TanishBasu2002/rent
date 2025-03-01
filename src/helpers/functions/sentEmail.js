import {
  Body,
  Column,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

export const RentAgreementEmail = ({
  renterName,
  unitNumber,
  propertyName,
  startDate,
  endDate,
  totalPrice,
  rentCollectionType,
}) => (
  <Html dir="rtl">
    <Head />
    <Body style={main}>
      <Preview>إشعار اتفاقية إيجار جديدة</Preview>
      <Container style={container}>
        <Section>
          <Row>
            <Column>
              <Img
                style={headerImage}
                src={`${baseUrl}/static/company-header.png`}
                width="305"
                height="28"
                alt="تذكير"
              />
            </Column>
          </Row>
        </Section>

        <Section style={paragraphContent}>
          <Hr style={hr} />
          <Text style={heading}>إشعار اتفاقية إيجار</Text>
          <Text style={paragraph}>عزيزي/عزيزتي {renterName}،</Text>
          <Text style={paragraph}>
            نود إعلامكم بأنه تم إنشاء اتفاقية إيجار جديدة للوحدة رقم{" "}
            {unitNumber} في {propertyName}.
          </Text>
        </Section>

        <Section style={paragraphList}>
          <Text style={paragraph}>تفاصيل الاتفاقية:</Text>
          <Text style={listItem}>• تاريخ البدء: {startDate}</Text>
          <Text style={listItem}>• تاريخ الانتهاء: {endDate}</Text>
          <Text style={listItem}>• إجمالي سعر العقد: {totalPrice} درهم</Text>
          <Text style={listItem}>
            • نوع تحصيل الإيجار: كل {rentCollectionType} أشهر
          </Text>
        </Section>

        <Section style={paragraphContent}>
          <Text style={paragraph}>
            نشكركم على ثقتكم بنا ونتطلع إلى خدمتكم بشكل مستمر.
          </Text>
          <Hr style={hr} />
        </Section>

        <Section style={{ ...paragraphContent, paddingBottom: 30 }}>
          <Text style={footerText}>© {new Date().getFullYear()}</Text>
          <Text style={footerText}>
            لقد تلقيت هذا البريد الإلكتروني لأنك مستأجر مسجل في نظامنا.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default RentAgreementEmail;

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily: 'Arial, "Helvetica Neue", Helvetica, sans-serif',
};

const container = {
  margin: "30px auto",
  backgroundColor: "#fff",
  borderRadius: 5,
  overflow: "hidden",
};

const headerImage = {
  marginTop: "-1px",
  width: "100%",
};

const containerContact = {
  backgroundColor: "#f7f9fc",
  width: "90%",
  borderRadius: "5px",
  overflow: "hidden",
  paddingRight: "20px",
  margin: "20px auto",
};

const heading = {
  fontSize: "20px",
  lineHeight: "26px",
  fontWeight: "700",
  color: "#2c3e50",
  textAlign: "right",
};

const paragraphContent = {
  padding: "0 40px",
};

const paragraphList = {
  paddingRight: 40,
  paddingLeft: 40,
};

const paragraph = {
  fontSize: "16px",
  lineHeight: "24px",
  color: "#3c4043",
  textAlign: "right",
};

const listItem = {
  ...paragraph,
  paddingRight: "20px",
};

const hr = {
  borderColor: "#e8eaed",
  margin: "20px 0",
};

const footerText = {
  fontSize: "12px",
  color: "#6b7280",
  textAlign: "center",
  margin: "5px 0",
};
