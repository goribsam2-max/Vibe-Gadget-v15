import express from 'express';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import * as admin from 'firebase-admin';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

try {
  if (!admin.apps?.length) {
    if (fs.existsSync(path.resolve(process.cwd(), 'firebase-service-account.json'))) {
      const serviceAccount = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'firebase-service-account.json'), 'utf8'));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    } else {
      // Allows sending if GOOGLE_APPLICATION_CREDENTIALS exists (e.g. Cloud Run)
      admin.initializeApp();
    }
  }
} catch (e) {
  console.log('Firebase Admin init error:', e);
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.post('/api/send-push-all', express.json(), async (req, res) => {
    try {
      if (!admin.apps?.length) {
         return res.status(500).json({ error: 'Firebase Admin not initialized. Please add FIREBASE_SERVICE_ACCOUNT to your environment variables.' });
      }
      const { title, body, image, link } = req.body;
      const snapshot = await getFirestore().collection('users').get();
      const tokens = snapshot.docs.map(doc => doc.data().fcmToken).filter(Boolean);
      
      if (tokens.length === 0) {
         return res.json({ success: true, message: 'No tokens found', tokensCount: 0 });
      }

      const message: any = {
        notification: {
          title,
          body,
          ...(image && { image })
        },
        webpush: {
          fcmOptions: {
            link: link || '/'
          }
        },
        tokens: []
      };

      let successCount = 0;
      // sendEachForMulticast supports max 500 tokens
      for (let i = 0; i < tokens.length; i += 500) {
        message.tokens = tokens.slice(i, i + 500);
        await getMessaging().sendEachForMulticast(message);
        successCount += message.tokens.length;
      }

      try {
        await getFirestore().collection('push_notifications').add({
          title, body, image: image || '', link: link || '', sentAt: FieldValue.serverTimestamp(), successCount
        });
      } catch (dbErr) {
        console.error('Could not save to db:', dbErr);
      }

      res.json({ success: true, tokensCount: successCount });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: String(e.message || e) });
    }
  });

  app.post('/api/notify-telegram', express.json(), async (req, res) => {
    try {
      const { userName, message } = req.body;
      
      const botToken = "8236254617:AAFFTI9j4pl6U-8-pdJgZigWb2M75oBmyzg";
      const chatId = "5494141897";
      
      if (botToken && chatId) {
        const text = `<b>💬 New Chat Message</b>\n━━━━━━━━━━━━━━━━━━\n<b>👤 From:</b> ${userName}\n<b>📝 Message:</b>\n${message}\n━━━━━━━━━━━━━━━━━━\n<i>Reply from admin panel</i>`;
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' })
        });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Telegram notify err", error);
      res.status(500).json({ error: 'Failed' });
    }
  });

  // Simple REST fetcher for product data to avoid loading Firebase Client SDK in Node
  const fetchProductData = async (productId: string) => {
    try {
      const res = await fetch(`https://firestore.googleapis.com/v1/projects/vibegadgets-ae9d1/databases/(default)/documents/products/${productId}`);
      if (!res.ok) return null;
      const data = await res.json();
      return data.fields;
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  const isProd = process.env.NODE_ENV === "production";
  let vite: any;

  if (!isProd) {
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in prod except index.html
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, { index: false }));
  }

  app.get('*all', async (req, res) => {
    try {
      let template: string;
      
      if (!isProd) {
        template = fs.readFileSync(path.resolve('index.html'), 'utf-8');
        template = await vite.transformIndexHtml(req.originalUrl, template);
      } else {
        template = fs.readFileSync(path.join(process.cwd(), 'dist', 'index.html'), 'utf-8');
      }

      // Check if it's a product page
      const productMatch = req.path.match(/^\/product\/(.+)$/);
      if (productMatch && productMatch[1]) {
        const productId = productMatch[1];
        const product = await fetchProductData(productId);
        
        if (product) {
          const title = product.name?.stringValue || 'Vibe Gadgets';
          const description = product.description?.stringValue || 'Check out this amazing product on Vibe Gadgets.';
          const imageUrl = product.image?.stringValue || product.images?.arrayValue?.values?.[0]?.stringValue || 'https://vibe-gadget.vercel.app/og-image.jpg';
          const price = product.price?.integerValue || product.price?.doubleValue || 0;

          let metaTags = `
            <title>${title} | Vibe Gadgets</title>
            <meta name="description" content="${description}" />
            <meta property="og:title" content="${title} | Vibe Gadgets" />
            <meta property="og:description" content="${description}" />
            <meta property="og:image" content="${imageUrl}" />
            <meta property="og:type" content="product" />
            <meta property="product:price:amount" content="${price}" />
            <meta property="product:price:currency" content="BDT" />
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content="${title}" />
            <meta name="twitter:description" content="${description}" />
            <meta name="twitter:image" content="${imageUrl}" />
          `;

          // Inject meta tags
          const metaRegex = /<!-- META_TAGS_PLACEHOLDER -->[\s\S]*?<!-- END_META_TAGS_PLACEHOLDER -->/;
          if (metaRegex.test(template)) {
             template = template.replace(metaRegex, metaTags);
          } else {
             template = template.replace('</head>', `${metaTags}\n</head>`);
          }
        }
      }

      res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
    } catch (e: any) {
      if (!isProd && vite) {
        vite.ssrFixStacktrace(e);
      }
      console.log(e.stack);
      res.status(500).end(e.stack);
    }
  });

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
