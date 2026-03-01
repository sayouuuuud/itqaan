// Script لاختبار API الصور
// شغله بـ: node scripts/test-images.mjs

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

async function testImageAPI() {
  console.log('🧪 بدء اختبار API الصور...\n')

  const tests = [
    {
      name: 'بدون مفتاح',
      url: `${BASE_URL}/api/download?format=json`,
      expectError: true
    },
    {
      name: 'مفتاح وهمي',
      url: `${BASE_URL}/api/download?key=test-image.jpg&format=json`,
      expectError: true
    },
    {
      name: 'مفتاح uploads وهمي',
      url: `${BASE_URL}/api/download?key=uploads/test.jpg&format=json`,
      expectError: true
    }
  ]

  for (const test of tests) {
    try {
      console.log(`📋 اختبار: ${test.name}`)
      console.log(`🔗 URL: ${test.url}`)

      const response = await fetch(test.url)
      const data = await response.json()

      console.log(`📊 Status: ${response.status}`)
      console.log(`📦 Response:`, data)

      if (test.expectError && response.status !== 200) {
        console.log('✅ الخطأ المتوقع تم استلامه بشكل صحيح\n')
      } else if (!test.expectError && response.status === 200) {
        console.log('✅ الاستجابة الصحيحة تم استلامها\n')
      } else {
        console.log('⚠️ الاستجابة غير متوقعة\n')
      }

    } catch (error) {
      console.error(`❌ خطأ في اختبار ${test.name}:`, error.message, '\n')
    }
  }

  console.log('🏁 انتهاء الاختبارات')
  console.log('\n💡 نصائح:')
  console.log('1. تأكد من تشغيل الخادم: pnpm dev')
  console.log('2. تحقق من متغيرات البيئة في .env.local')
  console.log('3. تحقق من وجود الصور في قاعدة البيانات')
  console.log('4. افتح Developer Tools لرؤية logs التفصيلية')
}

// تشغيل الاختبار
testImageAPI().catch(console.error)







