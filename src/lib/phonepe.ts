import crypto from 'crypto';

export interface PhonePePaymentRequest {
  merchantId: string;
  merchantTransactionId: string;
  merchantUserId: string;
  amount: number;
  redirectUrl: string;
  redirectMode: string;
  callbackUrl: string;
  mobileNumber?: string;
  paymentInstrument: {
    type: string;
  };
}

export const generatePhonePePayload = (
  amount: number,
  orderId: string,
  userId: string,
  mobileNumber?: string
): PhonePePaymentRequest => {
  const merchantId = import.meta.env.VITE_PHONEPE_MERCHANT_ID;
  const callbackUrl = `${import.meta.env.VITE_APP_URL}/api/phonepe-callback`;
  const redirectUrl = `${import.meta.env.VITE_APP_URL}/payment-status`;

  return {
    merchantId,
    merchantTransactionId: orderId,
    merchantUserId: userId,
    amount: amount * 100, // Convert to paise
    redirectUrl,
    redirectMode: 'REDIRECT',
    callbackUrl,
    mobileNumber,
    paymentInstrument: {
      type: 'PAY_PAGE'
    }
  };
};

export const generatePhonePeChecksum = (payload: string, saltKey: string, saltIndex: string): string => {
  const stringToHash = `${payload}/pg/v1/pay${saltKey}`;
  const sha256Hash = crypto.createHash('sha256').update(stringToHash).digest('hex');
  return `${sha256Hash}###${saltIndex}`;
};

export const verifyPhonePeChecksum = (
  xVerify: string,
  response: string,
  saltKey: string
): boolean => {
  const [checksum] = xVerify.split('###');
  const stringToHash = response + saltKey;
  const calculatedChecksum = crypto.createHash('sha256').update(stringToHash).digest('hex');
  return checksum === calculatedChecksum;
};
