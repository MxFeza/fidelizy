const webpush = require('web-push')

const vapidKeys = webpush.generateVAPIDKeys()

console.log('\n=== VAPID Keys Generated ===\n')
console.log('VAPID_PUBLIC_KEY=' + vapidKeys.publicKey)
console.log('VAPID_PRIVATE_KEY=' + vapidKeys.privateKey)
console.log('VAPID_SUBJECT=mailto:contact@fidelizy.app')
console.log('\nAjoutez ces 3 variables dans Vercel > Settings > Environment Variables\n')
