import prisma from '../db';

export type ProductType = 'PHYSICAL' | 'DIGITAL' | 'LICENSE' | 'SUBSCRIPTION_PRODUCT' | 'DROPSHIPPING' | 'SERVICE';

export interface FulfillmentItem {
  orderItemId: string;
  productId: string;
  variantId?: string | null;
  productType: ProductType | string;
  quantity: number;
}

export interface FulfillmentPlan {
  physicalItems: FulfillmentItem[];
  digitalItems: FulfillmentItem[];
  licenseItems: FulfillmentItem[];
  subscriptionItems: FulfillmentItem[];
  dropshipItems: FulfillmentItem[];
  serviceItems: FulfillmentItem[];
}

export class FulfillmentService {
  /**
   * Partitions an order's items into their respective fulfillment channels.
   */
  static categorizeOrderItems(items: FulfillmentItem[]): FulfillmentPlan {
    const plan: FulfillmentPlan = {
      physicalItems: [],
      digitalItems: [],
      licenseItems: [],
      subscriptionItems: [],
      dropshipItems: [],
      serviceItems: [],
    };

    for (const item of items) {
      const type = (item.productType || 'PHYSICAL').toUpperCase();
      switch (type) {
        case 'DIGITAL':
          plan.digitalItems.push(item);
          break;
        case 'LICENSE':
          plan.licenseItems.push(item);
          break;
        case 'SUBSCRIPTION':
        case 'SUBSCRIPTION_PRODUCT':
          plan.subscriptionItems.push(item);
          break;
        case 'DROPSHIPPING':
          plan.dropshipItems.push(item);
          break;
        case 'SERVICE':
          plan.serviceItems.push(item);
          break;
        case 'PHYSICAL':
        default:
          plan.physicalItems.push(item);
          break;
      }
    }

    return plan;
  }

  /**
   * Dispatches automated fulfillment for digital downloads and software license keys upon payment.
   */
  static async fulfillDigitalEntitlements(orderId: string): Promise<{
    downloadGrantsCreated: number;
    licenseKeysAssigned: number;
  }> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
      },
    });

    if (!order) {
      throw new Error(`Order #${orderId} not found.`);
    }

    let downloadGrantsCreated = 0;
    let licenseKeysAssigned = 0;

    await prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        const type = item.productType.toUpperCase();

        // 1. Digital File Entitlements
        if (type === 'DIGITAL') {
          const digitalAssets = await tx.digitalAsset.findMany({
            where: { productId: item.productId },
          });

          for (const asset of digitalAssets) {
            const secureToken = `DL-${order.id.slice(-6)}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + (asset.expiresInDays || 30));

            await tx.downloadGrant.create({
              data: {
                orderItemId: item.id,
                digitalAssetId: asset.id,
                secureToken,
                maxDownloads: asset.maxDownloads || 5,
                expiresAt,
              },
            });
            downloadGrantsCreated++;
          }
        }

        // 2. Software License & Third-Party Subscription Key Pools
        if (type === 'LICENSE' || type === 'SUBSCRIPTION' || type === 'SUBSCRIPTION_PRODUCT') {
          const pool = await tx.licenseKeyPool.findFirst({
            where: { productId: item.productId },
          });

          if (pool) {
            const availableKeys = await tx.licenseKey.findMany({
              where: { poolId: pool.id, status: 'AVAILABLE' },
              take: item.quantity,
            });

            for (const keyRecord of availableKeys) {
              await tx.licenseKey.update({
                where: { id: keyRecord.id },
                data: {
                  status: 'ASSIGNED',
                  orderItemId: item.id,
                  assignedAt: new Date(),
                },
              });
              licenseKeysAssigned++;
            }
          }
        }
      }
    });

    return { downloadGrantsCreated, licenseKeysAssigned };
  }
}
