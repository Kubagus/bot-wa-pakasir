/*  

  Made By Lenwy
  Base : Lenwy
  WhatsApp : wa.me/6283829814737
  Telegram : t.me/ilenwy
  Youtube : @Lenwy

  Channel : https://whatsapp.com/channel/0029VaGdzBSGZNCmoTgN2K0u

  Copy Code?, Recode?, Rename?, Reupload?, Reseller? Taruh Credit Ya :D

  Mohon Untuk Tidak Menghapus Watermark Di Dalam Kode Ini

*/

// Import Module
import "./len.js"
import "./database/Menu/LenwyMenu.js"

import fs from "fs"
import axios from "axios";
import { downloadContentFromMessage, jidNormalizedUser, getContentType } from "@whiskeysockets/baileys"
import path from 'path'
import { createQris } from "./lib/pakasir.js";
import QRCode from 'qrcode'
// Scrape
import Ai4Chat from "./scrape/Ai4Chat.js"

// Track Messages
const processedMessages = new Set()
const groupMetadataCache = new Map();

// Read Json File
function readJSONSync(pathFile) {
    try {
        return JSON.parse(fs.readFileSync(pathFile, 'utf8'))
    } catch {
        return []
    }
}

// Export Handler
export default async (lenwy, m, meta) => {
    const { body, mediaType, sender: originalSender, pushname } = meta 
    const msg = m.messages[0]
    if (!msg.message) return

    const replyJid = msg.key.remoteJid;

    let authJid = originalSender; 

    const key = msg.key;
    if (key.participantAlt) {
      authJid = key.participantAlt;
    } else if (key.remoteJidAlt) {
      authJid = key.remoteJidAlt;
    } 
    
    const sender = authJid; 
    const normalizedSender = jidNormalizedUser(sender);

    // console.log(chalk.yellow(`[DEBUG JID] Sender Original: ${originalSender}`));
    // console.log(chalk.yellow(`[DEBUG JID] Sender Auth (PN): ${sender}`));
    // console.log(chalk.green(`[DEBUG JID] Sender Normal: ${normalizedSender}`));

    if (msg.key.fromMe) return

    // Anti Double
    if (processedMessages.has(msg.key.id)) return
    processedMessages.add(msg.key.id)
    setTimeout(() => processedMessages.delete(msg.key.id), 30000)

    const pplu = fs.readFileSync(globalThis.MenuImage)
    const len = {
        key: {
            participant: `0@s.whatsapp.net`,
            remoteJid: replyJid 
        },
        message: {
            contactMessage: {
                displayName: `${pushname}`,
                vcard: `BEGIN:VCARD\nVERSION:3.0\nN:XL;Lenwy,;;;\nFN: Lenwy V1.0\nitem1.TEL;waid=${sender.split("@")[0]}:+${sender.split("@")[0]}\nitem1.X-ABLabel:Ponsel\nEND:VCARD`,
                jpegThumbnail: pplu,
                thumbnail: pplu,
                sendEphemeral: true
            }
        }
    }

// Multi Prefix + Tanpa Prefix
let usedPrefix = null
    for (const pre of globalThis.prefix) {
        if (body.startsWith(pre)) {
            usedPrefix = pre
            break
        }
    }
    if (!usedPrefix && !globalThis.noprefix) return

    const args = usedPrefix
        ? body.slice(usedPrefix.length).trim().split(" ")
        : body.trim().split(" ")

    const command = args.shift().toLowerCase()
    const q = args.join(" ")

    // Custom Reply
    const lenwyreply = (teks) => lenwy.sendMessage(replyJid, { text: teks }, { quoted: len })

    // Gambar Menu
    const MenuImage = fs.readFileSync(globalThis.MenuImage)

    // Deteksi Grup & Admin
    const isGroup = replyJid.endsWith("@g.us") 

    // Hanya Private
    const IsPriv = !isGroup

    let isAdmin = false
    let isBotAdmin = false

    const GROUP_CACHE_TTL = 5 * 1000 // 5 Detik

    if (isGroup) {
    let metadataData = groupMetadataCache.get(replyJid);

    if (!metadataData || Date.now() - metadataData.time > GROUP_CACHE_TTL) {
        try {
            const metadata = await lenwy.groupMetadata(replyJid);
            groupMetadataCache.set(replyJid, {
                data: metadata,
                time: Date.now()
            });
        metadataData = groupMetadataCache.get(replyJid);
        } catch (e) {
            console.error("Gagal mengambil metadata grup:", e);
        }
    }

    const metadata = metadataData?.data;

      if (metadata) {
        const participants = metadata.participants;
        
        const userParticipant = participants.find(p => p.id === msg.key.participant);
        if (userParticipant) {
          isAdmin = userParticipant.admin === 'admin' || userParticipant.admin === 'superadmin';
        }

        const botJid = jidNormalizedUser(lenwy.user.id);
        const botParticipant = participants.find(p => p.id === botJid);

        if (botParticipant) {
          isBotAdmin = botParticipant.admin === 'admin' || botParticipant.admin === 'superadmin';
        } else {
          isBotAdmin = false;
        }
      }
    }

    // Premium
    const premiumPath = path.join(process.cwd(), 'WhatsApp', 'database', 'premium.json')
    const premiumUsers = readJSONSync(premiumPath)
    const isPremium = premiumUsers.includes(normalizedSender) 

    const CreatorPath = path.join(process.cwd(), 'WhatsApp', 'database', 'creator.json')
    const isCreatorArray = readJSONSync(CreatorPath)
    const isLenwy = isCreatorArray.includes(normalizedSender)
    // Command Yang Diperbolehkan User Free
    const allowedPrivateCommands = ['menu', 'aimenu', 'downmenu', 'downloadmenu']

    if (!isGroup && !isPremium && !isLenwy && !allowedPrivateCommands.includes(command)) {
        return lenwyreply("⚠️ *Kamu Bukan User Premium!*\n\nKamu Hanya Bisa Menggunakan Fitur *Menu* Di Private Chat");
    }

switch (command) {

case "menu": {
  await lenwy.sendMessage(replyJid, {
    image: MenuImage,
    caption: globalThis.lenwymenu,
    mentions: [normalizedSender]
  }, { quoted: len })
}
break

case 'list':
case 'listproduct': {
  const productsPath = path.join(process.cwd(), 'whatsApp', 'database', 'stock', 'products.json');
  const products = JSON.parse(fs.readFileSync(productsPath, 'utf8') || '[]');
  let msgText = 'Daftar Prroduk\n';
  for (const p of products) {
    msgText += `[${p.id}] ${p.name} - Rp ${p.price.toLocaleString()}\n`;
  }
  return lenwyreply(msgText);
}

case "admin": {
    if (!isAdmin) return lenwyreply(globalThis.mess.admin)
    lenwyreply("🎁 *Kamu Adalah Admin*")
}
break

case "group": {
    if (!isGroup) return lenwyreply(globalThis.mess.group)
    lenwyreply("🎁 *Kamu Sedang Berada Di Dalam Grup*")
}
break

case "private": {
    if (!IsPriv) return lenwyreply(globalThis.mess.private)
    lenwyreply("🎁 *Kamu Sedang Berada Di Dalam Private Chat*")
}
break

case 'order': {
  const id = q.trim();
  if (!id) return lenwyreply('Contoh : order 01\n_Gunakan "list" Untuk Melihat ID Produk._');
  const productsPath = path.join(process.cwd(), 'WhatsApp', 'database', 'stock', 'products.json');
  const products = JSON.parse(fs.readFileSync(productsPath, 'utf8') || '[]');
  const prod = products.find(p => p.id === id);
  if (!prod) return lenwyreply('_Produk Tidak Ditemukan. Coba "list"_');

  const ordersPath = path.join(process.cwd(), 'WhatsApp', 'database', 'orders.json');
  const orders = JSON.parse(fs.readFileSync(ordersPath, 'utf8') || '[]');

  // Cek Pending
  const existingOrder = orders.find(o => o.buyer === sender && o.status === 'pending');
  if (existingOrder) {
    return lenwyreply(
      `⚠️ *Order Belum Diselesaikan!*\n\nOrder ID : *${existingOrder.orderId}*\nProduk : *${prod.name}*\n\nGunakan *.Cancelorder* Jika Ingi`
    );
  }

  // Order ID
const orderId = `Lenwy${Date.now()}`;

try {
  const payment = await createQris({
    project: process.env.PAKASIR_PROJECT,
    apiKey: process.env.PAKASIR_API_KEY,
    orderId,
    amount: prod.price
  });

  // Payment QR
  const qrString = payment.payment?.payment_number || payment.payment_number || payment.paymentNumber || payment.qr;
  if(!qrString) {
    console.warn('No qr string in payment response', payment);
  }
  const qrBuffer = await QRCode.toBuffer(
    qrString || `https://app.pakasir.com/pay/${process.env.PAKASIR_PROJECT}/${prod.price}?order_id=${orderId}&qris_only=1`
  );

  // Kirim QR + Info Produk
  const caption = 
`*Order ID : ${orderId}*
*Produk : ${prod.name}*

*Deskripsi :*
${prod.desc || '-'}

*Harga : Rp ${(payment.amount ?? prod.price).toLocaleString()}*
Expired : ${new Date(payment.expired_at ?? Date.now()).toLocaleString()}

Silakan Bayar Via QRIS. Jika Sudah Berhasil, Produk Akan Otomatis Dikirimkan.`;

  const qrMsg = await lenwy.sendMessage(sender, { image: qrBuffer, caption }, { quoted: len });
  const infoMsg = await lenwy.sendMessage(sender, {
    text: `Bot Mungkin Perlu Waktu lebih lama Untuk Mengkonfirmasi Pembayaran Anda.
Silakan Tunggu Sebentar Dan Jangan Lakukan Pembayaran Ulang.

Jika Lebih Dari 10 Menit Belum Terkonfirmasi, Silakan Hubungi Owner.`
  }, { quoted: len });

  // simpan order
  const ordersPath = path.join(process.cwd(), 'WhatsApp', 'database', 'orders.json');
  const orders = JSON.parse(fs.readFileSync(ordersPath, 'utf8') || '[]');
  orders.push({
    orderId,
    productId: prod.id,
    buyer: sender,
    status: 'pending',
    amount: payment.amount ?? prod.price,
    createdAt: new Date().toISOString(),
    expiredAt: payment.expired_at ?? null,
    qrMessageId: qrMsg.key,
    infoMessageId: infoMsg.key
  });
  fs.writeFileSync(ordersPath, JSON.stringify(orders, null, 2));

} catch (err) {
  console.error('Create transaction error', err);
  return lenwyreply('Gagal membuat order. Coba lagi nanti.');
}
break;
}

// AI Menu =========================

case "aimenu": {
  lenwyreply(globalThis.aimenu)
}
break

case "ai": {
    if (!q) return lenwyreply("☘️ *Contoh:* Ai Apa itu JavaScript?")
    lenwyreply(globalThis.mess.wait)
    try {
        const lenai = await Ai4Chat(q)
        await lenwyreply(`*Lenwy AI*\n\n${lenai}`)
    } catch (error) {
        console.error("Error:", error)
        lenwyreply(globalThis.mess.error)
    }
}
break

// Download Menu =========================

case "downmenu":
case "downloadmenu": {
  lenwyreply(globalThis.downmenu)
}
break

        default: { // Reply Pesan Tidak Dikenal
           // lenwyreply(globalThis.mess.default) 
        }
    }
}


