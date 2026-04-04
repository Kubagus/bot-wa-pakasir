import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import { transactionDetail } from '../lib/pakasir.js';
import { jidNormalizedUser } from '@whiskeysockets/baileys';

const ORDERS_FILE = path.join(process.cwd(), 'WhatsApp', 'database', 'orders.json');
const PRODUCTS_FILE = path.join(process.cwd(), 'WhatsApp', 'database', 'stock', 'products.json');
const PREMIUM_FILE = path.join(process.cwd(), 'WhatsApp', 'database', 'premium.json');
const OWNER_FILE = path.join(process.cwd(), 'WhatsApp', 'database', 'creator.json');

async function deleteMessage(lenwy, jid, msgKey, tag = "DELETE") {
  if (!msgKey) return;

  try {
    await lenwy.sendMessage(jid, {
      delete: {
        remoteJid: jid,
        fromMe: msgKey.fromMe ?? true,
        id: msgKey.id,
        participant: msgKey.participant || undefined
      }
    });

    console.log(
      chalk.red.bold(`[${tag}]`),
      `( Pesan Lama Dihapus (${msgKey.id}) )`
    );
  } catch (err) {
    console.error(`[${tag}] Gagal hapus pesan:`, err);
  }
}

export async function startPolling(lenwy, {
  pakasirProject = process.env.PAKASIR_PROJECT,
  pakasirApiKey = process.env.PAKASIR_API_KEY,
  interval = 10000,
  timeoutMinutes = 3
} = {}) {
  if (!lenwy) throw new Error('WhatsApp connection (lenwy) required for polling');

  setInterval(async () => {
    try {
      const ordersRaw = await fs.readFile(ORDERS_FILE, 'utf8').catch(() => '[]');
      const orders = JSON.parse(ordersRaw || '[]');
      const now = Date.now();

      for (let idx = 0; idx < orders.length; idx++) {
        const order = orders[idx];
        if (order.status !== 'pending') continue;

        // Cek Expired
        const createdAt = new Date(order.createdAt).getTime();
        if (now - createdAt > timeoutMinutes * 60 * 1000) {
          console.log(chalk.red.bold("[EXPIRED]"), (`Order ID : ${order.orderId}`));
          orders[idx].status = 'expired';
          await fs.writeFile(ORDERS_FILE, JSON.stringify(orders, null, 2));

          // Hapus Pesan QR Lama
          if (order.qrMessageId) {
            await deleteMessage(lenwy, order.buyer, order.qrMessageId, "EXPIRED-QR");
            }
            continue;
        }
        // Cek Status Pembayaran
        const detail = await transactionDetail({
            project: pakasirProject,
            apiKey: pakasirApiKey,
            orderId: order.orderId,
            amount: order.amount
        });

        if (detail && detail.status === 'completed') {
        console.log(chalk.green.bold("[PAID]"), (`Order ID : ${order.orderId}`));

        // Konfirmasi Order
        orders[idx].status = 'paid';
        orders[idx].paidAt = new Date().toISOString();
        await fs.writeFile(ORDERS_FILE, JSON.stringify(orders, null, 2));

        // Ambil Produk
        const productsRaw = await fs.readFile(PRODUCTS_FILE, 'utf8').catch(() => '[]');
        const products = JSON.parse(productsRaw || '[]');
        const prod = products.find(p => p.id === order.productId);

        if (!prod) {
            console.error('[Polling] Produk tidak ditemukan untuk order', order.orderId);
            continue;
        }

        // Jika Produk Biasa (Regular)
        const filePath = path.join(process.cwd(), 'whatsApp', 'database', 'stock', prod.file);
        const fileBuffer = await fs.readFile(filePath);

        await lenwy.sendMessage(order.buyer, {
            document: fileBuffer,
            fileName: prod.file,
            mimetype: 'application/zip'
        });

        await lenwy.sendMessage(order.buyer, {
            text: `*🎁 Pembayaran Berhasil!*`
        });

        // Hapus QR Lama
        if (order.qrMessageId) {
            await deleteMessage(lenwy, order.buyer, order.qrMessageId, "PAID-QR");
        }
        if (order.infoMessageId) {
            await deleteMessage(lenwy, order.buyer, order.infoMessageId, "PAID-INFO");
        }

        // Notif admin
        try {
            const owners = JSON.parse(await fs.readFile(OWNER_FILE, 'utf8').catch(() => '[]'));
            for (const adm of owners) {
            await lenwy.sendMessage(adm, {
                text: `📦 Order Baru Dibayar!\n\nBuyer : ${jidNormalizedUser(order.buyer)}\nProduk : ${prod.name}\nOrder ID : ${order.orderId}`
            });
            }
        } catch (err) {
            console.error('[Polling] Gagal kirim notif regular ke admin:', err);
        }
        }
    }
} catch (err) {
  console.error('[Polling] Error:', err);
}
}, interval);
}