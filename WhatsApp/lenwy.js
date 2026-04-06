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
const pendingDeletes = new Map();

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

    const lenwyreply = (teks) => lenwy.sendMessage(replyJid, { text: teks }, { quoted: len })

    // Handle pending deletes before prefix check
    if (pendingDeletes.has(sender)) {
        const pending = pendingDeletes.get(sender)
        
        // Timeout 5 menit
        if (Date.now() - pending.timestamp > 5 * 60 * 1000) {
            pendingDeletes.delete(sender)
            lenwyreply("⏰ *Timeout.* Penghapusan dibatalkan.")
            return
        }

        const cleanBody = body.replace(/['"]/g, '').trim().toLowerCase()
        if (cleanBody === 'ya' && pending.step === 1) {
            pending.step = 2
            lenwyreply(`Setuju hapus produk ID ${pending.ids.join(', ')}? Reply 'hapus' untuk konfirmasi akhir.`)
            return
        } else if (cleanBody === 'hapus' && pending.step === 2) {
            const productsPath = path.join(process.cwd(), 'WhatsApp', 'database', 'stock', 'products.json')
            let products = JSON.parse(fs.readFileSync(productsPath, 'utf8') || '[]')
            products = products.filter(p => !pending.ids.includes(p.id))
            fs.writeFileSync(productsPath, JSON.stringify(products, null, 2))
            pendingDeletes.delete(sender)
            lenwyreply(`✅ Produk ID ${pending.ids.join(', ')} berhasil dihapus.`)
            return
        } else if (cleanBody === 'batal') {
            pendingDeletes.delete(sender)
            lenwyreply("❌ Penghapusan dibatalkan.")
            return
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
  const productsPath = path.join(process.cwd(), 'WhatsApp', 'database', 'stock', 'products.json');
  const products = JSON.parse(fs.readFileSync(productsPath, 'utf8') || '[]');
  let msgText = 'Daftar Produk\n';
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

case "addproduk": {
    if (!isLenwy && !isAdmin) return lenwyreply("⚠️ *Hanya Admin atau Owner yang bisa menambahkan produk!*")

    if (!q) return lenwyreply("☘️ *Contoh:* .addproduk name:Produk B, price:2000, file:produkb.zip, desc:Deskripsi optional")

    // Parse input
    const params = q.split(',').map(p => p.trim())
    let name, price, file, desc, type = "regular"

    for (const param of params) {
        const [key, ...valueParts] = param.split(':')
        const value = valueParts.join(':').trim()
        switch (key.toLowerCase()) {
            case 'name':
                name = value
                break
            case 'price':
                price = parseInt(value)
                if (isNaN(price)) return lenwyreply("⚠️ *Price harus berupa angka!*")
                break
            case 'file':
                file = value
                break
            case 'desc':
                desc = value
                break
            case 'type':
                type = value || "regular"
                break
        }
    }

    if (!name || !price || !file) return lenwyreply("⚠️ *Name, price, dan file wajib diisi!*")

    // Baca products.json
    const productsPath = path.join(process.cwd(), 'WhatsApp', 'database', 'stock', 'products.json')
    const products = JSON.parse(fs.readFileSync(productsPath, 'utf8') || '[]')

    // Generate ID baru
    const maxId = products.length > 0 ? Math.max(...products.map(p => parseInt(p.id))) : 0
    const newId = (maxId + 1).toString().padStart(2, '0')

    // Tambahkan produk baru
    const newProduct = {
        id: newId,
        name,
        price,
        desc: desc || "",
        file,
        type
    }
    products.push(newProduct)

    // Tulis kembali file
    fs.writeFileSync(productsPath, JSON.stringify(products, null, 2))

    lenwyreply(`✅ *Produk berhasil ditambahkan!*\n\nID: ${newId}\nNama: ${name}\nHarga: Rp ${price.toLocaleString()}\nFile: ${file}\nDeskripsi: ${desc || '-'}\nType: ${type}`)
}
break

case "cari": {
    if (!q) return lenwyreply("☘️ *Contoh:* .cari Produk B")

    const keyword = q.toLowerCase()
    const productsPath = path.join(process.cwd(), 'WhatsApp', 'database', 'stock', 'products.json')
    const products = JSON.parse(fs.readFileSync(productsPath, 'utf8') || '[]')

    // Filter produk yang match (case insensitive, partial)
    const results = products.filter(p => p.name.toLowerCase().includes(keyword))

    if (results.length === 0) {
        return lenwyreply("❌ *Produk tidak ditemukan!*")
    }

    let msgText = `🔍 *Hasil Pencarian untuk "${q}"*\n\n`
    for (const p of results) {
        msgText += `📦 *ID:* ${p.id}\n`
        msgText += `📝 *Nama:* ${p.name}\n`
        msgText += `💰 *Harga:* Rp ${p.price.toLocaleString()}\n`
        msgText += `📄 *Deskripsi:* ${p.desc || '-'}\n`
        msgText += `📁 *File:* ${p.file}\n`
        msgText += `🏷️ *Type:* ${p.type}\n\n`
    }

    lenwyreply(msgText.trim())
}
break

case "update": {
    if (!isLenwy && !isAdmin) return lenwyreply("⚠️ *Hanya Admin atau Owner yang bisa update produk!*")

    if (!q) return lenwyreply("☘️ *Contoh:* .update 01 price:1500; 02 name:Produk C, price:1000")

    const productsPath = path.join(process.cwd(), 'WhatsApp', 'database', 'stock', 'products.json')
    let products = JSON.parse(fs.readFileSync(productsPath, 'utf8') || '[]')

    // Split by semicolon untuk produk-produk
    const productUpdates = q.split(';').map(p => p.trim()).filter(p => p)

    let updatedCount = 0
    let errors = []

    for (const updateStr of productUpdates) {
        // Split by space untuk id dan params
        const parts = updateStr.split(' ')
        if (parts.length < 2) {
            errors.push(`Format salah: ${updateStr}`)
            continue
        }
        const id = parts[0]
        const paramsStr = parts.slice(1).join(' ')

        // Cari produk
        const productIndex = products.findIndex(p => p.id === id)
        if (productIndex === -1) {
            errors.push(`Produk ID ${id} tidak ditemukan`)
            continue
        }

        // Parse params
        const params = paramsStr.split(',').map(p => p.trim())
        let updates = {}

        for (const param of params) {
            const [key, ...valueParts] = param.split(':')
            const value = valueParts.join(':').trim()
            switch (key.toLowerCase()) {
                case 'name':
                    updates.name = value
                    break
                case 'price':
                    const newPrice = parseInt(value)
                    if (isNaN(newPrice)) {
                        errors.push(`Price harus angka untuk ID ${id}`)
                        continue
                    }
                    updates.price = newPrice
                    break
                case 'file':
                    updates.file = value
                    break
                case 'desc':
                    updates.desc = value
                    break
                case 'type':
                    updates.type = value
                    break
                default:
                    errors.push(`Parameter ${key} tidak valid untuk ID ${id}`)
            }
        }

        // Update produk
        Object.assign(products[productIndex], updates)
        updatedCount++
    }

    // Tulis kembali file
    fs.writeFileSync(productsPath, JSON.stringify(products, null, 2))

    let replyMsg = `✅ *Update berhasil!*\n\nJumlah produk diupdate: ${updatedCount}`
    if (errors.length > 0) {
        replyMsg += `\n\n⚠️ *Error:*\n${errors.join('\n')}`
    }
    lenwyreply(replyMsg)
}
break

case "delete": {
    if (!isLenwy) return lenwyreply("⚠️ *Hanya Owner yang bisa hapus produk!*")

    const ids = q.split(',').map(id => id.trim()).filter(id => id)
    if (!ids.length) return lenwyreply("☘️ *Contoh:* .delete 01, 03")

    const productsPath = path.join(process.cwd(), 'WhatsApp', 'database', 'stock', 'products.json')
    const products = JSON.parse(fs.readFileSync(productsPath, 'utf8') || '[]')

    const validIds = ids.filter(id => products.some(p => p.id === id))
    if (validIds.length !== ids.length) {
        const invalidIds = ids.filter(id => !products.some(p => p.id === id))
        return lenwyreply(`⚠️ *ID berikut tidak ditemukan:* ${invalidIds.join(', ')}`)
    }

    // Simpan pending delete
    pendingDeletes.set(sender, { ids: validIds, step: 1, timestamp: Date.now() })

    const deleteProducts = products.filter(p => validIds.includes(p.id))
    let confirmText = `⚠️ *Konfirmasi Penghapusan Produk*\n\n`
    for (const p of deleteProducts) {
        confirmText += `📦 *ID:* ${p.id}\n`
        confirmText += `📝 *Nama:* ${p.name}\n`
        confirmText += `💰 *Harga:* Rp ${p.price.toLocaleString()}\n`
        confirmText += `📄 *Deskripsi:* ${p.desc || '-'}\n`
        confirmText += `📁 *File:* ${p.file}\n`
        confirmText += `🏷️ *Type:* ${p.type}\n\n`
    }
    confirmText += `Apakah yakin hapus produk di atas? Reply 'ya' untuk lanjut.`

    lenwyreply(confirmText)
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


