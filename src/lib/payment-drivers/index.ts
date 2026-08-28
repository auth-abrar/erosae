import prisma from '../db';
import { decryptData } from '../encryption';
import { PaymentGatewayDriver, GatewayConfig } from './types';
import { StripeDriver } from './stripe';
import { CashOnDeliveryDriver } from './cod';
import { BankTransferDriver } from './bank-transfer';
import { CustomStructuredGatewayDriver } from './custom-structured';

const drivers: Record<string, PaymentGatewayDriver> = {
  STRIPE: new StripeDriver(),
  COD: new CashOnDeliveryDriver(),
  BANK_TRANSFER: new BankTransferDriver(),
  CUSTOM_STRUCTURED: new CustomStructuredGatewayDriver(),
};

export function getPaymentDriver(driverType: string): PaymentGatewayDriver {
  const driver = drivers[driverType.toUpperCase()];
  if (!driver) {
    throw new Error(`Unsupported payment driver: ${driverType}`);
  }
  return driver;
}

export async function getGatewayConfigBySlug(slug: string): Promise<GatewayConfig | null> {
  const gateway = await prisma.paymentGateway.findUnique({
    where: { slug },
  });

  if (!gateway) return null;

  let credentials = {};
  try {
    const decrypted = decryptData(gateway.encryptedConfig);
    credentials = JSON.parse(decrypted || '{}');
  } catch (err) {
    console.error('Failed to parse gateway config:', err);
  }

  let supportedCurrencies: string[] = [];
  try {
    supportedCurrencies = JSON.parse(gateway.supportedCurrencies);
  } catch {
    supportedCurrencies = ['USD'];
  }

  let supportedCountries: string[] = [];
  try {
    supportedCountries = JSON.parse(gateway.supportedCountries);
  } catch {
    supportedCountries = ['*'];
  }

  return {
    id: gateway.id,
    name: gateway.name,
    slug: gateway.slug,
    driver: gateway.driver as any,
    isEnabled: gateway.isEnabled,
    isTestMode: gateway.isTestMode,
    supportedCurrencies,
    supportedCountries,
    credentials,
  };
}

export async function getActiveGatewaysForCustomer(
  currencyCode: string = 'USD',
  countryCode?: string
): Promise<GatewayConfig[]> {
  const allGateways = await prisma.paymentGateway.findMany({
    where: { isEnabled: true },
    orderBy: { displayOrder: 'asc' },
  });

  const validGateways: GatewayConfig[] = [];

  for (const g of allGateways) {
    let supportedCurrencies: string[] = [];
    try {
      supportedCurrencies = JSON.parse(g.supportedCurrencies);
    } catch {
      supportedCurrencies = ['*'];
    }

    let supportedCountries: string[] = [];
    try {
      supportedCountries = JSON.parse(g.supportedCountries);
    } catch {
      supportedCountries = ['*'];
    }

    const matchesCurrency =
      supportedCurrencies.includes('*') || supportedCurrencies.includes(currencyCode);

    const matchesCountry =
      !countryCode ||
      supportedCountries.includes('*') ||
      supportedCountries.includes(countryCode);

    if (matchesCurrency && matchesCountry) {
      let credentials = {};
      try {
        const decrypted = decryptData(g.encryptedConfig);
        credentials = JSON.parse(decrypted || '{}');
      } catch {}

      validGateways.push({
        id: g.id,
        name: g.name,
        slug: g.slug,
        driver: g.driver as any,
        isEnabled: g.isEnabled,
        isTestMode: g.isTestMode,
        supportedCurrencies,
        supportedCountries,
        credentials,
      });
    }
  }

  return validGateways;
}