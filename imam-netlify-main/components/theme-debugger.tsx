'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

interface DiagnosticData {
  htmlClasses: string
  cssVariables: Record<string, string>
  navbarStyles: Record<string, string> | null
  componentStyles: {
    body: { background: string; classes: string }
    main: { background: string; classes: string } | null
    section: { background: string; classes: string } | null
    card: { background: string; classes: string } | null
  }
  issues: string[]
  themeState: {
    theme: string | undefined
    resolvedTheme: string | undefined
    systemTheme: string | undefined
  }
  localStorage: string | null
  expanded?: boolean
  diagnostics?: {
    themeConsistency: { status: string; issues: string[]; details: any }
    cssVariables: { status: string; issues: string[]; details: any }
    componentStyles: { status: string; issues: string[]; details: any }
    performance: { status: string; issues: string[]; details: any }
    recommendations: string[]
  }
  professionalTools?: {
    tailwindConfig?: {
      configFound: boolean
      configUrl: string | null
      darkModeSetting: string | null
      issues: string[]
      recommendations: string[]
      timestamp: string
    }
    domDarkScan?: {
      elementsWithDark: Array<{ element: string, classes: string }>
      count: number
      timestamp: string
    }
    cssMediaQueries?: {
      rules: Array<{ rule: string, styleSheet: string }>
      count: number
      timestamp: string
    }
    themeProvider?: {
      themeProviderFound: boolean
      attribute: string | null
      value: string | null
      issues: string[]
      recommendations: string[]
      timestamp: string
    }
    cssOverrides?: {
      hardcodedColors: Array<{ element: string, property: string, value: string }>
      count: number
      timestamp: string
    }
    darkModeTrigger?: {
      htmlHasDarkClass: boolean
      htmlHasLightClass: boolean
      bodyHasDarkClass: boolean
      bodyHasLightClass: boolean
      domElementsWithDark: number
      tailwindDarkVariants: Array<{ element: string, classes: string[] }>
      potentialTriggers: string[]
      rootCause: string | null
      solution: string | null
      timestamp: string
    }
  }
}

// Utility function to convert hex to RGB
function hexToRgb(hex: string): number[] | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : null
}

export function ThemeDebugger() {
  const { theme, resolvedTheme, systemTheme } = useTheme()
  const [diagnostics, setDiagnostics] = useState<DiagnosticData>({
    htmlClasses: '',
    cssVariables: {},
    navbarStyles: {},
    componentStyles: {
      body: { background: '', classes: '' },
      main: null,
      section: null,
      card: null
    },
    issues: [],
    themeState: { theme: '', resolvedTheme: '', systemTheme: '' },
    localStorage: null,
    diagnostics: {
      themeConsistency: { status: 'ok', issues: [], details: {} },
      cssVariables: { status: 'ok', issues: [], details: {} },
      componentStyles: { status: 'ok', issues: [], details: {} },
      performance: { status: 'ok', issues: [], details: {} },
      recommendations: []
    },
    professionalTools: {}
  })

  useEffect(() => {
    const runDiagnostics = () => {
      try {
        // 1. Check HTML classes
        const htmlElement = document.documentElement
        const htmlClasses = Array.from(htmlElement.classList).join(' ')

        // 2. Get localStorage value
        const localStorageValue = localStorage.getItem('theme')

        // 3. Get CSS variable values
        const styles = getComputedStyle(htmlElement)
        const cssVars: Record<string, string> = {}
        const colorProps = [
          '--color-background',
          '--color-surface',
          '--color-foreground',
          '--color-text-main',
          '--color-text-muted',
          '--color-card',
          '--color-border',
          '--color-primary',
          '--color-secondary',
          '--color-input',
          '--color-accent',
          '--color-muted'
        ]

        colorProps.forEach(prop => {
          const value = styles.getPropertyValue(prop).trim()
          if (value) {
            cssVars[prop] = value
          }
        })

        // 4. Check actual navbar colors
        const navbar = document.querySelector('header') || document.querySelector('nav')
        let navbarStyles: Record<string, string> | null = null

        if (navbar) {
          const computedStyles = getComputedStyle(navbar)
          navbarStyles = {
            backgroundColor: computedStyles.backgroundColor,
            color: computedStyles.color,
            borderColor: computedStyles.borderColor,
            classes: Array.from(navbar.classList).join(' '),
            inlineStyles: navbar.getAttribute('style') || 'none'
          }
        }

        // 5. Check all page components
        const bodyElement = document.body
        const bodyStyles = getComputedStyle(bodyElement)
        const bodyBg = bodyStyles.backgroundColor
        const bodyClasses = Array.from(bodyElement.classList).join(' ')

        const main = document.querySelector('main') || document.querySelector('body > div')
        let mainStyles = null
        if (main) {
          const computedMain = getComputedStyle(main)
          mainStyles = {
            background: computedMain.backgroundColor,
            classes: Array.from(main.classList).join(' ')
          }
        }

        const section = document.querySelector('section')
        let sectionStyles = null
        if (section) {
          const computedSection = getComputedStyle(section)
          sectionStyles = {
            background: computedSection.backgroundColor,
            classes: Array.from(section.classList).join(' ')
          }
        }

        const card = document.querySelector('[class*="bg-white"], [class*="bg-slate"], [class*="card"]')
        let cardStyles = null
        if (card) {
          const computedCard = getComputedStyle(card)
          cardStyles = {
            background: computedCard.backgroundColor,
            classes: Array.from(card.classList).join(' ')
          }
        }

        // 5. Comprehensive and professional issue detection
        const issues: string[] = []
        const diagnostics: any = {
          themeConsistency: { status: 'ok', issues: [], details: {} },
          cssVariables: { status: 'ok', issues: [], details: {} },
          componentStyles: { status: 'ok', issues: [], details: {} },
          performance: { status: 'ok', issues: [], details: {} },
          recommendations: []
        }

        // 5.1 Theme Consistency Analysis
        diagnostics.themeConsistency.details = {
          htmlHasDark: htmlClasses.includes('dark'),
          htmlHasLight: htmlClasses.includes('light'),
          nextThemesTheme: theme,
          resolvedTheme: resolvedTheme,
          systemTheme: systemTheme,
          localStorageValue: localStorageValue
        }

        // Critical theme synchronization issues
        if (resolvedTheme === 'dark' && !htmlClasses.includes('dark')) {
          issues.push('🚨 CRITICAL: تضارب في حالة الثيم - تم اختيار الوضع المظلم لكن عنصر HTML لا يحتوي على class "dark"')
          diagnostics.themeConsistency.status = 'critical'
          diagnostics.themeConsistency.issues.push('HTML class mismatch')
          diagnostics.recommendations.push('فحص إعدادات ThemeProvider أو إعادة تحميل الصفحة')
        }

        if (resolvedTheme === 'light' && htmlClasses.includes('dark')) {
          issues.push('🚨 CRITICAL: تضارب في حالة الثيم - الوضع الفاتح يجب ألا يحتوي على class "dark"')
          diagnostics.themeConsistency.status = 'critical'
          diagnostics.themeConsistency.issues.push('HTML class conflict - light mode should not have dark class')
          diagnostics.recommendations.push('مسح localStorage أو إعادة تشغيل التطبيق')
        }

        if (resolvedTheme === 'light' && !htmlClasses.includes('light')) {
          issues.push('⚠️ WARNING: الوضع الفاتح يجب أن يحتوي على class "light" لتطبيق CSS variables')
          diagnostics.themeConsistency.status = 'warning'
          diagnostics.themeConsistency.issues.push('Missing light class for CSS variables')
          diagnostics.recommendations.push('ThemeFixer سيضيف class "light" تلقائياً')
        }

        if (!resolvedTheme) {
          issues.push('⚠️ تحذير: لم يتم تحديد الثيم المحلول (resolvedTheme is undefined)')
          diagnostics.themeConsistency.status = 'warning'
          diagnostics.themeConsistency.issues.push('Undefined resolved theme')
          diagnostics.recommendations.push('فحص إعدادات next-themes في ThemeProvider')
        }

        // 5.2 CSS Variables Analysis
        const expectedColors = {
          light: {
            background: '#f8fafc',
            surface: '#ffffff',
            foreground: '#0f172a',
            primary: '#1e5631'
          },
          dark: {
            background: '#0f172a',
            surface: '#1e293b',
            foreground: '#f8fafc',
            primary: '#22c55e'
          }
        }

        const currentTheme = resolvedTheme || 'light'
        const expected = expectedColors[currentTheme as keyof typeof expectedColors]

        diagnostics.cssVariables.details = {
          currentTheme: currentTheme,
          expected: expected,
          actual: cssVars,
          missing: [],
          incorrect: []
        }

        // Check missing variables
        const missingVars = colorProps.filter(prop => !cssVars[prop])
        if (missingVars.length > 0) {
          issues.push(`⚠️ متغيرات CSS مفقودة: ${missingVars.join(', ')}`)
          diagnostics.cssVariables.status = 'warning'
          diagnostics.cssVariables.issues.push(`Missing ${missingVars.length} CSS variables`)
          diagnostics.cssVariables.details.missing = missingVars
          diagnostics.recommendations.push('فحص ملف globals.css للتأكد من وجود جميع متغيرات الألوان')
        }

        // Check incorrect variable values
        Object.entries(expected).forEach(([prop, expectedValue]) => {
          const cssVarName = `--color-${prop}`
          const actualValue = cssVars[cssVarName]
          if (actualValue && actualValue !== expectedValue) {
            issues.push(`🔧 قيمة متغير CSS غير صحيحة: ${cssVarName} = ${actualValue} (المتوقع: ${expectedValue})`)
            diagnostics.cssVariables.status = 'warning'
            diagnostics.cssVariables.issues.push(`Incorrect ${cssVarName}`)
            diagnostics.cssVariables.details.incorrect.push({
              variable: cssVarName,
              expected: expectedValue,
              actual: actualValue
            })
          }
        })

        // 5.3 Component Styles Analysis (keep only essential info, not full computed styles)
        diagnostics.componentStyles.details = {
          body: { background: bodyStyles.backgroundColor, classes: bodyClasses },
          section: sectionStyles ? { background: sectionStyles.background, classes: sectionStyles.classes } : null,
          card: cardStyles ? { background: cardStyles.background, classes: cardStyles.classes } : null,
          navbar: navbarStyles ? {
            background: navbarStyles.backgroundColor,
            classes: navbarStyles.classes,
            inlineStyles: navbarStyles.inlineStyles
          } : null
        }

        // Body analysis
        const expectedBodyBg = expected.background
        const rgbExpectedBody = `rgb(${hexToRgb(expectedBodyBg)?.join(', ')})`

        if (bodyBg !== rgbExpectedBody && bodyBg !== 'rgba(0, 0, 0, 0)') {
          const severity = resolvedTheme === 'light' && bodyBg.includes('rgb(15, 23, 42)') ? 'critical' : 'warning'
          issues.push(`${severity === 'critical' ? '🚨 CRITICAL' : '⚠️'}: خلفية الجسم غير صحيحة في وضع ${resolvedTheme === 'dark' ? 'المظلم' : 'الفاتح'}`)
          issues.push(`   الخلفية الحالية: ${bodyBg}`)
          issues.push(`   الخلفية المتوقعة: ${rgbExpectedBody}`)
          issues.push(`   Classes: "${bodyClasses}"`)

          if (severity === 'critical') {
            diagnostics.componentStyles.status = 'critical'
            diagnostics.recommendations.push('فحص classes الخاصة بـ body element في layout.tsx')
          }
        }

        // Section analysis
        if (sectionStyles) {
          const isDarkInLight = resolvedTheme === 'light' && (
            sectionStyles.background.includes('rgb(15, 23, 42)') ||
            sectionStyles.background.includes('rgb(30, 41, 59)') ||
            sectionStyles.background.includes('rgb(51, 65, 85)')
          )

          if (isDarkInLight) {
            issues.push('🚨 CRITICAL: عنصر القسم يظهر بلون مظلم في الوضع الفاتح!')
            issues.push(`   الخلفية: ${sectionStyles.background}`)
            issues.push(`   Classes: "${sectionStyles.classes}"`)
            issues.push(`   الحل: إضافة class "bg-white dark:bg-slate-800" أو إزالة "dark:" من classes`)
            diagnostics.componentStyles.status = 'critical'
            diagnostics.recommendations.push('فحص classes الخاصة بعناصر section وإصلاح تضارب الثيم')
          }
        }

        // Card analysis
        if (cardStyles) {
          const isDarkCardInLight = resolvedTheme === 'light' && (
            cardStyles.background.includes('rgb(30, 41, 59)') ||
            cardStyles.background.includes('rgb(51, 65, 85)') ||
            cardStyles.background.includes('rgb(15, 23, 42)')
          )

          if (isDarkCardInLight) {
            issues.push('🚨 CRITICAL: البطاقة تظهر بلون مظلم في الوضع الفاتح!')
            issues.push(`   الخلفية: ${cardStyles.background}`)
            issues.push(`   Classes: "${cardStyles.classes}"`)
            issues.push(`   الحل: التأكد من وجود "bg-white dark:bg-slate-800" في classes`)
            diagnostics.componentStyles.status = 'critical'
            diagnostics.recommendations.push('فحص classes الخاصة بعناصر البطاقات وإصلاح تضارب الثيم')
          }
        }

        // Navbar analysis
        if (navbarStyles) {
          const lightNavbar = 'rgba(255, 255, 255, 0.95)'
          const darkNavbar = 'rgba(30, 41, 59, 0.95)'

          const isWrongLightNavbar = resolvedTheme === 'light' && navbarStyles.backgroundColor === darkNavbar
          const isWrongDarkNavbar = resolvedTheme === 'dark' && navbarStyles.backgroundColor === lightNavbar

          if (isWrongLightNavbar || isWrongDarkNavbar) {
            issues.push(`🚨 CRITICAL: الnavbar يظهر بلون ${resolvedTheme === 'light' ? 'مظلم' : 'فاتح'} في الوضع ${resolvedTheme === 'dark' ? 'المظلم' : 'الفاتح'}!`)
            issues.push(`   الخلفية الحالية: ${navbarStyles.backgroundColor}`)
            issues.push(`   Classes: "${navbarStyles.classes}"`)
            diagnostics.componentStyles.status = 'critical'
            diagnostics.recommendations.push('فحص component الnavbar وإصلاح تضارب الألوان')
          }
        }

        // 5.4 Performance Analysis
        const themeSwitchTime = performance.now() // Placeholder for theme switch timing
        diagnostics.performance.details = {
          themeSwitchTime: themeSwitchTime,
          cssVariablesCount: Object.keys(cssVars).length,
          domQueriesTime: Date.now() // Placeholder
        }

        // Overall status
        const hasCritical = issues.some(issue => issue.includes('🚨 CRITICAL'))
        const hasWarnings = issues.some(issue => issue.includes('⚠️') || issue.includes('🔧'))

        if (issues.length === 0) {
          issues.push('✅ جميع أنظمة الثيم تعمل بشكل صحيح')
        } else if (hasCritical) {
          issues.push(`🔴 تم اكتشاف ${issues.filter(i => i.includes('🚨')).length} مشاكل حرجة تحتاج إصلاح فوري`)
        } else if (hasWarnings) {
          issues.push(`🟡 تم اكتشاف ${issues.filter(i => i.includes('⚠️') || i.includes('🔧')).length} تحذيرات تحتاج مراجعة`)
        }

        setDiagnostics({
          htmlClasses,
          cssVariables: cssVars,
          navbarStyles,
          componentStyles: {
            body: { background: bodyBg, classes: bodyClasses },
            main: mainStyles,
            section: sectionStyles,
            card: cardStyles
          },
          issues,
          themeState: { theme, resolvedTheme, systemTheme },
          localStorage: localStorageValue,
          expanded: diagnostics.expanded,
          diagnostics
        })

      } catch (error) {
        console.error('🔍 Diagnostic Error:', error)
        setDiagnostics(prev => ({
          ...prev,
          issues: [`❌ Diagnostic system error: ${error}`]
        }))
      }
    }

    // Run immediately and every 2 seconds
    runDiagnostics()
    const interval = setInterval(runDiagnostics, 2000)
    return () => clearInterval(interval)
  }, [theme, resolvedTheme, systemTheme])

  const forceDarkClass = (e: React.MouseEvent) => {
    console.log('🔧 Force Dark button clicked!', e)
    e.preventDefault()
    e.stopPropagation()
    document.documentElement.classList.add('dark')
    console.log('🔧 Added dark class to HTML')
  }

  const forceLightClass = (e: React.MouseEvent) => {
    console.log('🔧 Force Light button clicked!', e)
    e.preventDefault()
    e.stopPropagation()
    document.documentElement.classList.remove('dark')
    console.log('🔧 Removed dark class from HTML')
  }

  const logAllCSSVariables = (e: React.MouseEvent) => {
    console.log('🔧 Log Variables button clicked!', e)
    e.preventDefault()
    e.stopPropagation()
    const styles = getComputedStyle(document.documentElement)
    const allVars: Record<string, string> = {}

    for (let i = 0; i < styles.length; i++) {
      const prop = styles[i]
      if (prop && prop.startsWith('--color')) {
        allVars[prop] = styles.getPropertyValue(prop)
      }
    }

    console.group('🎨 All CSS Variables')
    console.table(allVars)
    console.groupEnd()
  }

  const inspectNavbar = (e: React.MouseEvent) => {
    console.log('🔧 Inspect Navbar button clicked!', e)
    e.preventDefault()
    e.stopPropagation()
    const navbar = document.querySelector('header') || document.querySelector('nav')
    if (navbar) {
      console.group('📊 Navbar Inspection')
      console.log('Element:', navbar)
      console.log('Classes:', Array.from(navbar.classList))
      console.log('Computed styles:', getComputedStyle(navbar))
      console.log('Inline styles:', navbar.getAttribute('style'))
      console.groupEnd()
    } else {
      console.error('❌ Navbar element not found')
    }
  }

  const clearLocalStorage = (e: React.MouseEvent) => {
    console.log('🔧 Clear LocalStorage button clicked!', e)
    e.preventDefault()
    e.stopPropagation()
    console.log('🗑️ Clearing localStorage theme...')
    localStorage.removeItem('theme')
    console.log('✅ localStorage cleared')
    // Show success message
    const notification = document.createElement('div')
    notification.className = 'fixed top-4 left-4 bg-orange-500 text-white px-4 py-2 rounded shadow-lg z-[10000] font-medium'
    notification.textContent = '🗑️ تم مسح localStorage - أعد تحميل الصفحة'
    document.body.appendChild(notification)
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification)
      }
    }, 3000)
  }

  const reloadTheme = (e: React.MouseEvent) => {
    console.log('🔧 Reload button clicked!', e)
    e.preventDefault()
    e.stopPropagation()
    console.log('🔄 Reloading page...')
    window.location.reload()
  }

  const testThemeSwitching = async (e: React.MouseEvent) => {
    console.log('🔧 Test Theme Switching button clicked!', e)
    e.preventDefault()
    e.stopPropagation()

    try {
      const startTime = performance.now()
      const initialTheme = diagnostics.themeState.resolvedTheme

      // Test switching to opposite theme
      const targetTheme = initialTheme === 'dark' ? 'light' : 'dark'
      console.log(`🔄 Testing theme switch from ${initialTheme} to ${targetTheme}`)

      // Force theme change
      if (targetTheme === 'dark') {
        document.documentElement.classList.add('dark')
        document.documentElement.classList.remove('light')
      } else {
        document.documentElement.classList.remove('dark')
        document.documentElement.classList.add('light')
      }

      // Wait for changes to apply
      await new Promise(resolve => setTimeout(resolve, 100))

      // Check if theme actually changed
      const newHtmlClasses = Array.from(document.documentElement.classList).join(' ')
      const switchTime = performance.now() - startTime

      const success = targetTheme === 'dark' ?
        newHtmlClasses.includes('dark') :
        !newHtmlClasses.includes('dark')

      // Restore original theme
      if (initialTheme === 'dark') {
        document.documentElement.classList.add('dark')
        document.documentElement.classList.remove('light')
      } else {
        document.documentElement.classList.remove('dark')
        document.documentElement.classList.add('light')
      }

      // Show results
      const notification = document.createElement('div')
      notification.className = `fixed top-4 left-4 px-4 py-2 rounded shadow-lg z-[10000] font-medium ${success ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`
      notification.textContent = success ?
        `✅ تبديل الثيم ناجح (${switchTime.toFixed(1)}ms)` :
        `❌ فشل في تبديل الثيم (${switchTime.toFixed(1)}ms)`
      document.body.appendChild(notification)

      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification)
        }
      }, 3000)

      console.log(`🔄 Theme switch test result:`, {
        success,
        switchTime,
        initialTheme,
        targetTheme,
        finalClasses: newHtmlClasses
      })

    } catch (error) {
      console.error('❌ Theme switching test failed:', error)
    }
  }

  const validateCSSVariables = async (e: React.MouseEvent) => {
    console.log('🔧 Validate CSS Variables button clicked!', e)
    e.preventDefault()
    e.stopPropagation()

    try {
      const styles = getComputedStyle(document.documentElement)
      const allVars: Record<string, string> = {}
      const missingVars: string[] = []
      const invalidVars: string[] = []

      // Collect all CSS variables
      for (let i = 0; i < styles.length; i++) {
        const prop = styles[i]
        if (prop && prop.startsWith('--color')) {
          const value = styles.getPropertyValue(prop).trim()
          allVars[prop] = value

          if (!value) {
            missingVars.push(prop)
          } else if (!value.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i) &&
            !value.match(/^rgb\(/) &&
            !value.match(/^hsl\(/)) {
            invalidVars.push(`${prop}: ${value}`)
          }
        }
      }

      const totalVars = Object.keys(allVars).length
      const validVars = totalVars - missingVars.length - invalidVars.length

      // Show results
      const notification = document.createElement('div')
      notification.className = `fixed top-4 left-4 px-4 py-2 rounded shadow-lg z-[10000] font-medium ${missingVars.length === 0 && invalidVars.length === 0 ?
        'bg-green-500 text-white' : 'bg-yellow-500 text-white'
        }`
      notification.textContent = `📊 متغيرات CSS: ${validVars}/${totalVars} صحيحة ${missingVars.length > 0 ? `(${missingVars.length} مفقودة)` : ''
        }${invalidVars.length > 0 ? `(${invalidVars.length} غير صحيحة)` : ''}`

      document.body.appendChild(notification)

      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification)
        }
      }, 4000)

      console.group('🎨 CSS Variables Validation')
      console.log('Total variables:', totalVars)
      console.log('Valid variables:', validVars)
      if (missingVars.length > 0) console.log('Missing:', missingVars)
      if (invalidVars.length > 0) console.log('Invalid:', invalidVars)
      console.table(allVars)
      console.groupEnd()

    } catch (error) {
      console.error('❌ CSS variables validation failed:', error)
    }
  }

  const testComponentRendering = async (e: React.MouseEvent) => {
    console.log('🔧 Test Component Rendering button clicked!', e)
    e.preventDefault()
    e.stopPropagation()

    try {
      const startTime = performance.now()
      const components = ['body', 'header', 'main', 'section', 'nav', 'article', 'aside', 'footer']
      const results: Record<string, any> = {}

      components.forEach(selector => {
        const elements = document.querySelectorAll(selector)
        if (elements.length > 0) {
          results[selector] = {
            count: elements.length,
            hasBackground: Array.from(elements).some(el =>
              getComputedStyle(el).backgroundColor !== 'rgba(0, 0, 0, 0)'
            ),
            hasClasses: Array.from(elements).some(el => el.classList.length > 0)
          }
        }
      })

      const testTime = performance.now() - startTime

      // Show results
      const notification = document.createElement('div')
      notification.className = 'fixed top-4 left-4 bg-purple-500 text-white px-4 py-2 rounded shadow-lg z-[10000] font-medium'
      notification.textContent = `🔍 فحص المكونات مكتمل (${testTime.toFixed(1)}ms)`
      document.body.appendChild(notification)

      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification)
        }
      }, 3000)

      console.group('🔍 Component Rendering Test')
      console.log('Test time:', testTime.toFixed(1) + 'ms')
      console.table(results)
      console.groupEnd()

    } catch (error) {
      console.error('❌ Component rendering test failed:', error)
    }
  }

  // 🔧 PROFESSIONAL DEBUGGING TOOLS FOR DARK MODE ACCURACY

  const analyzeTailwindConfig = async (e: React.MouseEvent) => {
    console.log('🔧 Tailwind Config Analyzer clicked!', e)
    e.preventDefault()
    e.stopPropagation()

    try {
      // Try to fetch tailwind.config.js/ts
      const configUrls = ['/tailwind.config.js', '/tailwind.config.ts', '/tailwind.config.mjs']
      let configContent = null
      let configUrl = null

      for (const url of configUrls) {
        try {
          const response = await fetch(url)
          if (response.ok) {
            configContent = await response.text()
            configUrl = url
            break
          }
        } catch (err) {
          continue
        }
      }

      const analysis = {
        configFound: !!configContent,
        configUrl,
        darkModeSetting: null as string | null,
        issues: [] as string[],
        recommendations: [] as string[]
      }

      if (configContent) {
        // Check for darkMode setting
        const darkModeRegex = /darkMode\s*:\s*['"`]([^'"`]+)['"`]|darkMode\s*:\s*\[([^\]]+)\]/g
        const matches = configContent.match(darkModeRegex)

        if (matches) {
          for (const match of matches) {
            if (match.includes('class')) {
              analysis.darkModeSetting = 'class'
            } else if (match.includes('media')) {
              analysis.darkModeSetting = 'media'
              analysis.issues.push('🚨 CRITICAL: Tailwind darkMode is set to "media" but should be "class" for manual theme control')
            } else if (match.includes('selector')) {
              analysis.darkModeSetting = 'selector'
              analysis.issues.push('⚠️ Tailwind darkMode is set to "selector" - verify it works with your theme system')
            }
          }
        } else {
          analysis.issues.push('⚠️ No darkMode setting found in Tailwind config - defaults to "media"')
          analysis.darkModeSetting = 'media (default)'
          analysis.recommendations.push('Add darkMode: ["class"] to tailwind.config.js')
        }

        // Check for proper darkMode: ['class'] syntax
        if (configContent.includes('darkMode: \'class\'') || configContent.includes("darkMode: \"class\"") || configContent.includes('darkMode: `class`')) {
          analysis.recommendations.push('✅ Tailwind darkMode is correctly set to "class"')
        }
      } else {
        analysis.issues.push('❌ Could not fetch tailwind.config.js - check if file exists')
      }

      console.group('🎨 Tailwind Config Analysis')
      console.log('Config found:', analysis.configFound)
      console.log('Config URL:', analysis.configUrl)
      console.log('Dark mode setting:', analysis.darkModeSetting)
      console.log('Issues:', analysis.issues)
      console.log('Recommendations:', analysis.recommendations)
      console.groupEnd()

      // Save results to state
      setDiagnostics(prev => ({
        ...prev,
        professionalTools: {
          ...prev.professionalTools,
          tailwindConfig: {
            ...analysis,
            timestamp: new Date().toISOString()
          }
        }
      }))

      // Show results
      const notification = document.createElement('div')
      notification.className = `fixed top-4 left-4 px-4 py-2 rounded shadow-lg z-[10000] font-medium ${analysis.issues.length > 0 ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
        }`
      notification.textContent = analysis.issues.length > 0 ?
        `⚠️ Tailwind Config Issues: ${analysis.issues.length} found` :
        '✅ Tailwind Config OK (Saved to debug report)'
      document.body.appendChild(notification)

      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification)
        }
      }, 4000)

    } catch (error) {
      console.error('❌ Tailwind config analysis failed:', error)
    }
  }

  const scanDOMForDarkClasses = async (e: React.MouseEvent) => {
    console.log('🔧 DOM Dark Class Scanner clicked!', e)
    e.preventDefault()
    e.stopPropagation()

    try {
      const allElements = document.querySelectorAll('*')
      const elementsWithDarkClass: Array<{ element: Element, classes: string, selector: string }> = []

      allElements.forEach(element => {
        if (element.classList.contains('dark')) {
          elementsWithDarkClass.push({
            element,
            classes: Array.from(element.classList).join(' '),
            selector: element.tagName.toLowerCase() +
              (element.id ? `#${element.id}` : '') +
              (element.className ? `.${Array.from(element.classList).join('.')}` : '')
          })
        }
      })

      console.group('🌑 DOM Dark Class Scan Results')
      console.log(`Found ${elementsWithDarkClass.length} elements with 'dark' class`)

      if (elementsWithDarkClass.length > 0) {
        console.table(elementsWithDarkClass.map(item => ({
          tag: item.element.tagName.toLowerCase(),
          id: item.element.id || 'none',
          classes: item.classes,
          text: item.element.textContent?.slice(0, 50) + '...' || ''
        })))
      } else {
        console.log('✅ No elements found with "dark" class - this is correct for light mode')
      }
      console.groupEnd()

      // Save results to state
      setDiagnostics(prev => ({
        ...prev,
        professionalTools: {
          ...prev.professionalTools,
          domDarkScan: {
            elementsWithDark: elementsWithDarkClass.map(item => ({
              element: `${item.element.tagName.toLowerCase()}${item.element.id ? `#${item.element.id}` : ''}`,
              classes: item.classes
            })),
            count: elementsWithDarkClass.length,
            timestamp: new Date().toISOString()
          }
        }
      }))

      // Show results
      const notification = document.createElement('div')
      notification.className = `fixed top-4 left-4 px-4 py-2 rounded shadow-lg z-[10000] font-medium ${elementsWithDarkClass.length > 0 ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
        }`
      notification.textContent = elementsWithDarkClass.length > 0 ?
        `🚨 FOUND: ${elementsWithDarkClass.length} elements with 'dark' class! (Saved)` :
        '✅ No elements with "dark" class found (Saved)'
      document.body.appendChild(notification)

      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification)
        }
      }, 4000)

    } catch (error) {
      console.error('❌ DOM dark class scan failed:', error)
    }
  }

  const detectCSSMediaQueries = async (e: React.MouseEvent) => {
    console.log('🔧 CSS Media Query Detector clicked!', e)
    e.preventDefault()
    e.stopPropagation()

    try {
      // Get all stylesheets
      const styleSheets = Array.from(document.styleSheets)
      const mediaQueryRules: Array<{ rule: string, styleSheet: string }> = []

      styleSheets.forEach((sheet, sheetIndex) => {
        try {
          const rules = Array.from(sheet.cssRules || [])
          rules.forEach(rule => {
            if (rule instanceof CSSMediaRule) {
              if (rule.conditionText.includes('prefers-color-scheme')) {
                mediaQueryRules.push({
                  rule: rule.cssText,
                  styleSheet: sheet.href || `inline-${sheetIndex}`
                })
              }
            }
          })
        } catch (e) {
          // CORS or other errors accessing stylesheet rules
        }
      })

      console.group('📱 CSS Media Query Analysis')
      console.log(`Found ${mediaQueryRules.length} @media (prefers-color-scheme) rules`)

      if (mediaQueryRules.length > 0) {
        console.table(mediaQueryRules)
        console.warn('🚨 These media queries may be interfering with class-based dark mode!')
      } else {
        console.log('✅ No @media (prefers-color-scheme) rules found - good for class-based theming')
      }
      console.groupEnd()

      // Save results to state
      setDiagnostics(prev => ({
        ...prev,
        professionalTools: {
          ...prev.professionalTools,
          cssMediaQueries: {
            rules: mediaQueryRules,
            count: mediaQueryRules.length,
            timestamp: new Date().toISOString()
          }
        }
      }))

      // Show results
      const notification = document.createElement('div')
      notification.className = `fixed top-4 left-4 px-4 py-2 rounded shadow-lg z-[10000] font-medium ${mediaQueryRules.length > 0 ? 'bg-yellow-500 text-white' : 'bg-green-500 text-white'
        }`
      notification.textContent = mediaQueryRules.length > 0 ?
        `⚠️ FOUND: ${mediaQueryRules.length} prefers-color-scheme rules (Saved)` :
        '✅ No problematic media queries found (Saved)'
      document.body.appendChild(notification)

      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification)
        }
      }, 4000)

    } catch (error) {
      console.error('❌ CSS media query detection failed:', error)
    }
  }

  const inspectThemeProvider = async (e: React.MouseEvent) => {
    console.log('🔧 ThemeProvider Inspector clicked!', e)
    e.preventDefault()
    e.stopPropagation()

    try {
      // Look for ThemeProvider in the DOM
      const themeProvider = document.querySelector('[data-theme], [class*="theme"], [id*="theme"]') ||
        document.querySelector('div') // Fallback to check any div

      const analysis = {
        themeProviderFound: !!themeProvider,
        attribute: null as string | null,
        value: null as string | null,
        issues: [] as string[],
        recommendations: [] as string[]
      }

      if (themeProvider) {
        // Check for data-theme attribute
        const dataTheme = themeProvider.getAttribute('data-theme')
        if (dataTheme) {
          analysis.attribute = 'data-theme'
          analysis.value = dataTheme
          if (dataTheme !== 'light' && dataTheme !== 'dark') {
            analysis.issues.push('⚠️ data-theme attribute has unexpected value')
          }
        }

        // Check for class-based theming
        const classes = Array.from(themeProvider.classList)
        const hasLightClass = classes.includes('light')
        const hasDarkClass = classes.includes('dark')

        if (hasLightClass || hasDarkClass) {
          analysis.attribute = 'class'
          analysis.value = hasDarkClass ? 'dark' : 'light'
        }

        // Analyze configuration
        if (!analysis.attribute) {
          analysis.issues.push('❌ No theme attribute found on ThemeProvider')
          analysis.recommendations.push('ThemeProvider should have attribute="class" prop')
        }

        if (analysis.attribute === 'data-theme') {
          analysis.issues.push('⚠️ Using data-theme attribute instead of class-based theming')
          analysis.recommendations.push('Consider switching to attribute="class" for better Tailwind integration')
        }
      }

      console.group('🎭 ThemeProvider Analysis')
      console.log('ThemeProvider found:', analysis.themeProviderFound)
      console.log('Attribute:', analysis.attribute)
      console.log('Value:', analysis.value)
      console.log('Issues:', analysis.issues)
      console.log('Recommendations:', analysis.recommendations)
      console.groupEnd()

      // Save results to state
      setDiagnostics(prev => ({
        ...prev,
        professionalTools: {
          ...prev.professionalTools,
          themeProvider: {
            ...analysis,
            timestamp: new Date().toISOString()
          }
        }
      }))

      // Show results
      const notification = document.createElement('div')
      notification.className = `fixed top-4 left-4 px-4 py-2 rounded shadow-lg z-[10000] font-medium ${analysis.issues.length > 0 ? 'bg-yellow-500 text-white' : 'bg-green-500 text-white'
        }`
      notification.textContent = analysis.issues.length > 0 ?
        `⚠️ ThemeProvider issues: ${analysis.issues.length} found (Saved)` :
        '✅ ThemeProvider configuration OK (Saved)'
      document.body.appendChild(notification)

      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification)
        }
      }, 4000)

    } catch (error) {
      console.error('❌ ThemeProvider inspection failed:', error)
    }
  }

  const detectCSSOverrides = async (e: React.MouseEvent) => {
    console.log('🔧 CSS Override Detector clicked!', e)
    e.preventDefault()
    e.stopPropagation()

    try {
      const allElements = document.querySelectorAll('*')
      const hardcodedDarkColors: Array<{
        element: Element,
        property: string,
        value: string,
        selector: string
      }> = []

      // Dark color patterns to look for
      const darkColorPatterns = [
        /#[0-9a-f]{6}/gi, // Hex colors
        /rgb\(\s*\d+,\s*\d+,\s*\d+\)/gi, // RGB colors
        /hsl\(\s*\d+,\s*\d+%,\s*\d+%\)/gi // HSL colors
      ]

      const isDarkColor = (color: string): boolean => {
        // Convert various color formats to RGB for analysis
        const tempDiv = document.createElement('div')
        tempDiv.style.color = color
        document.body.appendChild(tempDiv)
        const computedColor = getComputedStyle(tempDiv).color
        document.body.removeChild(tempDiv)

        // Extract RGB values
        const rgbMatch = computedColor.match(/rgb\(\s*(\d+),\s*(\d+),\s*(\d+)\)/)
        if (rgbMatch) {
          const [r, g, b] = rgbMatch.slice(1).map(Number)
          // Consider it dark if it's darker than a medium gray
          const brightness = (r * 299 + g * 587 + b * 114) / 1000
          return brightness < 128 // Dark colors have low brightness
        }
        return false
      }

      allElements.forEach(element => {
        const computedStyle = getComputedStyle(element)

        // Check background-color
        const bgColor = computedStyle.backgroundColor
        if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent' && isDarkColor(bgColor)) {
          hardcodedDarkColors.push({
            element,
            property: 'background-color',
            value: bgColor,
            selector: element.tagName.toLowerCase() +
              (element.id ? `#${element.id}` : '') +
              (element.className ? `.${Array.from(element.classList).join('.')}` : '')
          })
        }

        // Check color (text color)
        const textColor = computedStyle.color
        if (textColor && isDarkColor(textColor)) {
          hardcodedDarkColors.push({
            element,
            property: 'color',
            value: textColor,
            selector: element.tagName.toLowerCase() +
              (element.id ? `#${element.id}` : '') +
              (element.className ? `.${Array.from(element.classList).join('.')}` : '')
          })
        }
      })

      console.group('🎨 CSS Override Detection')
      console.log(`Found ${hardcodedDarkColors.length} potential hardcoded dark colors`)

      if (hardcodedDarkColors.length > 0) {
        console.table(hardcodedDarkColors.slice(0, 20)) // Limit to first 20 for readability
        if (hardcodedDarkColors.length > 20) {
          console.log(`... and ${hardcodedDarkColors.length - 20} more`)
        }
      } else {
        console.log('✅ No hardcoded dark colors found')
      }
      console.groupEnd()

      // Save results to state
      setDiagnostics(prev => ({
        ...prev,
        professionalTools: {
          ...prev.professionalTools,
          cssOverrides: {
            hardcodedColors: hardcodedDarkColors.map(item => ({
              element: item.selector,
              property: item.property,
              value: item.value
            })),
            count: hardcodedDarkColors.length,
            timestamp: new Date().toISOString()
          }
        }
      }))

      // Show results
      const notification = document.createElement('div')
      notification.className = `fixed top-4 left-4 px-4 py-2 rounded shadow-lg z-[10000] font-medium ${hardcodedDarkColors.length > 0 ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
        }`
      notification.textContent = hardcodedDarkColors.length > 0 ?
        `🚨 FOUND: ${hardcodedDarkColors.length} hardcoded dark colors! (Saved)` :
        '✅ No hardcoded dark colors found (Saved)'
      document.body.appendChild(notification)

      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification)
        }
      }, 4000)

    } catch (error) {
      console.error('❌ CSS override detection failed:', error)
    }
  }

  const analyzeTailwindDarkMode = async (e: React.MouseEvent) => {
    console.log('🔧 Tailwind Dark Mode Trigger Analysis clicked!', e)
    e.preventDefault()
    e.stopPropagation()

    try {
      const analysis = {
        htmlHasDarkClass: document.documentElement.classList.contains('dark'),
        htmlHasLightClass: document.documentElement.classList.contains('light'),
        bodyHasDarkClass: document.body.classList.contains('dark'),
        bodyHasLightClass: document.body.classList.contains('light'),
        domElementsWithDark: document.querySelectorAll('.dark').length,
        tailwindDarkVariants: [] as Array<{ element: Element, classes: string[] }>,
        potentialTriggers: [] as string[],
        rootCause: null as string | null,
        solution: null as string | null
      }

      // Check for Tailwind dark variants being applied
      const elements = document.querySelectorAll('[class*="dark:"]')
      const darkVariants: Array<{ element: Element, classes: string[] }> = []

      elements.forEach(element => {
        const darkClasses = Array.from(element.classList).filter(cls => cls.startsWith('dark:'))
        if (darkClasses.length > 0) {
          darkVariants.push({
            element,
            classes: darkClasses
          })
        }
      })

      analysis.tailwindDarkVariants = darkVariants

      // Determine potential triggers
      if (analysis.htmlHasDarkClass) {
        analysis.potentialTriggers.push('HTML element has "dark" class')
      }

      if (analysis.bodyHasDarkClass) {
        analysis.potentialTriggers.push('Body element has "dark" class')
      }

      if (analysis.domElementsWithDark > 0) {
        analysis.potentialTriggers.push(`${analysis.domElementsWithDark} elements have "dark" class`)
      }

      // Analyze media queries
      const styleSheets = Array.from(document.styleSheets)
      const hasMediaQueries = styleSheets.some(sheet => {
        try {
          return Array.from(sheet.cssRules || []).some(rule =>
            rule instanceof CSSMediaRule && rule.conditionText.includes('prefers-color-scheme')
          )
        } catch (e) {
          return false
        }
      })

      if (hasMediaQueries) {
        analysis.potentialTriggers.push('CSS has @media (prefers-color-scheme) rules')
      }

      // Determine root cause and solution
      if (analysis.htmlHasDarkClass && !analysis.htmlHasLightClass) {
        analysis.rootCause = 'HTML element has "dark" class but no "light" class'
        analysis.solution = 'Remove "dark" class from HTML element or ensure "light" class is present'
      } else if (analysis.bodyHasDarkClass) {
        analysis.rootCause = 'Body element has "dark" class'
        analysis.solution = 'Remove "dark" class from body element'
      } else if (hasMediaQueries) {
        analysis.rootCause = 'CSS media queries are triggering dark mode'
        analysis.solution = 'Remove @media (prefers-color-scheme) rules from CSS'
      } else if (analysis.tailwindDarkVariants.length > 0) {
        analysis.rootCause = 'Tailwind dark variants are being applied'
        analysis.solution = 'Check why Tailwind thinks dark mode is active'
      }

      console.group('🌙 Tailwind Dark Mode Trigger Analysis')
      console.log('HTML classes:', {
        hasDark: analysis.htmlHasDarkClass,
        hasLight: analysis.htmlHasLightClass
      })
      console.log('Body classes:', {
        hasDark: analysis.bodyHasDarkClass,
        hasLight: analysis.bodyHasLightClass
      })
      console.log('DOM elements with dark class:', analysis.domElementsWithDark)
      console.log('Tailwind dark variants applied:', analysis.tailwindDarkVariants.length)
      console.log('Potential triggers:', analysis.potentialTriggers)
      console.log('Root cause:', analysis.rootCause)
      console.log('Solution:', analysis.solution)
      console.groupEnd()

      // Save results to state
      setDiagnostics(prev => ({
        ...prev,
        professionalTools: {
          ...prev.professionalTools,
          darkModeTrigger: {
            ...analysis,
            tailwindDarkVariants: analysis.tailwindDarkVariants.map(item => ({
              element: item.element.tagName.toLowerCase() +
                (item.element.id ? `#${item.element.id}` : ''),
              classes: item.classes
            })),
            timestamp: new Date().toISOString()
          }
        }
      }))

      // Show results
      const notification = document.createElement('div')
      notification.className = `fixed top-4 left-4 px-4 py-2 rounded shadow-lg z-[10000] font-medium ${analysis.potentialTriggers.length > 0 ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
        }`
      notification.textContent = analysis.potentialTriggers.length > 0 ?
        `🚨 FOUND: ${analysis.potentialTriggers.length} dark mode triggers! (Saved)` :
        '✅ No dark mode triggers found (Saved)'
      document.body.appendChild(notification)

      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification)
        }
      }, 5000)

    } catch (error) {
      console.error('❌ Tailwind dark mode analysis failed:', error)
    }
  }

  const runAllProfessionalDiagnostics = async () => {
    console.log('🚀 Running all professional diagnostics...')

    try {
      // Run all professional tools in sequence
      await Promise.all([
        new Promise(resolve => setTimeout(() => {
          const event = { preventDefault: () => { }, stopPropagation: () => { } } as React.MouseEvent
          analyzeTailwindConfig(event)
          resolve(void 0)
        }, 100)),
        new Promise(resolve => setTimeout(() => {
          const event = { preventDefault: () => { }, stopPropagation: () => { } } as React.MouseEvent
          scanDOMForDarkClasses(event)
          resolve(void 0)
        }, 200)),
        new Promise(resolve => setTimeout(() => {
          const event = { preventDefault: () => { }, stopPropagation: () => { } } as React.MouseEvent
          detectCSSMediaQueries(event)
          resolve(void 0)
        }, 300)),
        new Promise(resolve => setTimeout(() => {
          const event = { preventDefault: () => { }, stopPropagation: () => { } } as React.MouseEvent
          inspectThemeProvider(event)
          resolve(void 0)
        }, 400)),
        new Promise(resolve => setTimeout(() => {
          const event = { preventDefault: () => { }, stopPropagation: () => { } } as React.MouseEvent
          detectCSSOverrides(event)
          resolve(void 0)
        }, 500)),
        new Promise(resolve => setTimeout(() => {
          const event = { preventDefault: () => { }, stopPropagation: () => { } } as React.MouseEvent
          analyzeTailwindDarkMode(event)
          resolve(void 0)
        }, 600))
      ])

      // Wait a bit for all data to be saved
      await new Promise(resolve => setTimeout(resolve, 1000))

      console.log('✅ All professional diagnostics completed')
    } catch (error) {
      console.error('❌ Error running professional diagnostics:', error)
    }
  }

  const copyAllDebugContent = async (e: React.MouseEvent) => {
    console.log('🔧 Copy Debug Content button clicked!', e)
    e.preventDefault()
    e.stopPropagation()

    try {
      // Ensure all professional diagnostics are run before exporting
      if (!diagnostics.professionalTools || Object.keys(diagnostics.professionalTools).length === 0) {
        console.log('📊 Professional tools not run yet, running them now...')
        await runAllProfessionalDiagnostics()
        // Wait for state updates
        await new Promise(resolve => setTimeout(resolve, 1500))
      }

      // Create comprehensive debug report with enhanced professional tools data
      const debugReport = {
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        diagnostics: {
          ...diagnostics,
          // Remove bulky componentStyles.details with full computed styles
          componentStyles: {
            ...diagnostics.componentStyles,
            details: undefined // Remove the massive computed style objects
          }
        },
        domAnalysis: {
          htmlClasses: diagnostics.htmlClasses,
          bodyClasses: diagnostics.componentStyles.body.classes,
          hasDarkClass: diagnostics.htmlClasses.includes('dark'),
          hasLightClass: diagnostics.htmlClasses.includes('light'),
          // Light mode should have NO 'dark' class (may have 'light' class with default next-themes)
          isCorrectLightMode: diagnostics.themeState.resolvedTheme === 'light' &&
            !diagnostics.htmlClasses.includes('dark'),
          // Dark mode should have 'dark' class
          isCorrectDarkMode: diagnostics.themeState.resolvedTheme === 'dark' &&
            diagnostics.htmlClasses.includes('dark'),
          allElementsWithDarkClass: diagnostics.professionalTools?.domDarkScan?.elementsWithDark || [],
          totalDarkClassesFound: diagnostics.professionalTools?.domDarkScan?.count || 0
        },
        themeProviderState: {
          theme: diagnostics.themeState.theme,
          resolvedTheme: diagnostics.themeState.resolvedTheme,
          systemTheme: diagnostics.themeState.systemTheme,
          providerConfig: diagnostics.professionalTools?.themeProvider || null,
          attribute: diagnostics.professionalTools?.themeProvider?.attribute || 'unknown',
          storageKey: 'theme (default)',
          enableSystem: false
        },
        // 🔬 ENHANCED PROFESSIONAL TOOLS RESULTS
        professionalTools: {
          tailwindConfig: diagnostics.professionalTools?.tailwindConfig || {
            status: 'not_run',
            message: 'Run Tailwind Config Analysis to populate this data'
          },
          domAnalysis: {
            darkClasses: diagnostics.professionalTools?.domDarkScan || {
              status: 'not_run',
              message: 'Run DOM Dark Scan to populate this data'
            },
            mediaQueries: diagnostics.professionalTools?.cssMediaQueries || {
              status: 'not_run',
              message: 'Run Media Queries Check to populate this data'
            },
            cssOverrides: diagnostics.professionalTools?.cssOverrides || {
              status: 'not_run',
              message: 'Run CSS Overrides Detection to populate this data'
            }
          },
          themeSystem: {
            themeProvider: diagnostics.professionalTools?.themeProvider || {
              status: 'not_run',
              message: 'Run ThemeProvider Deep Dive to populate this data'
            },
            darkModeTriggers: diagnostics.professionalTools?.darkModeTrigger || {
              status: 'not_run',
              message: 'Run Dark Mode Trigger Analysis to populate this data'
            }
          },
          performance: {
            diagnosticRunTime: Date.now(),
            toolsRunCount: Object.keys(diagnostics.professionalTools || {}).length,
            hasAllToolsRun: Object.keys(diagnostics.professionalTools || {}).length >= 6
          }
        },
        recommendations: diagnostics.issues.filter(issue => issue.includes('🚨 CRITICAL')).length > 0 ? [
          'فحص إعدادات ThemeProvider في layout.tsx',
          'التأكد من أن next-themes يعمل بشكل صحيح',
          'فحص CSS variables في globals.css',
          'التأكد من عدم وجود تضارب في classes',
          'تشغيل جميع أدوات التشخيص المهنية للحصول على تحليل كامل'
        ] : [
          'تشغيل جميع أدوات التشخيص المهنية للتحقق من سلامة النظام',
          'فحص التحديثات الدورية للثيم'
        ]
      }

      const reportText = JSON.stringify(debugReport, null, 2)

      await navigator.clipboard.writeText(reportText)

      // Show success message
      const notification = document.createElement('div')
      notification.className = 'fixed top-4 left-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-[10000] font-medium'
      notification.textContent = '✅ تم نسخ محتوى الديباج بنجاح!'
      document.body.appendChild(notification)

      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification)
        }
      }, 3000)

      console.log('📋 Debug content copied to clipboard:', debugReport)

    } catch (error) {
      console.error('❌ Failed to copy debug content:', error)

      // Show error message
      const notification = document.createElement('div')
      notification.className = 'fixed top-4 left-4 bg-red-500 text-white px-4 py-2 rounded shadow-lg z-[10000] font-medium'
      notification.textContent = '❌ فشل في نسخ محتوى الديباج'
      document.body.appendChild(notification)

      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification)
        }
      }, 3000)
    }
  }

  const getThemeStatus = () => {
    const status = diagnostics.issues.length === 0 ? 'operational' : 'issues-detected'
    const statusColor = diagnostics.issues.length === 0 ? 'text-green-600' : 'text-red-600'
    return { status, statusColor }
  }

  const { status, statusColor } = getThemeStatus()

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg shadow-2xl max-w-lg max-h-96 overflow-auto z-[9999] font-mono text-xs">
      {/* Header */}
      <div className="mb-4 pb-3 border-b border-gray-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            🔍 Theme Diagnostics
            <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${statusColor}`}>
              {status.toUpperCase()}
            </span>
          </h3>
          <button
            onClick={() => setDiagnostics(prev => ({ ...prev, expanded: !prev.expanded }))}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 text-xs"
          >
            {diagnostics.expanded ? '▼ Collapse' : '▲ Expand'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className={`${diagnostics.expanded ? 'max-h-80' : 'max-h-48'} overflow-auto transition-all duration-300`}>

        {/* Theme State */}
        <div className="mb-4">
          <h4 className="font-semibold text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-2">
            <span>🎨</span> Theme State
          </h4>
          <div className="bg-gray-50 dark:bg-slate-800 rounded p-3 border border-gray-200 dark:border-slate-700">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <div className="text-gray-600 dark:text-gray-400 mb-1">next-themes</div>
                <div className="font-mono text-foreground">{diagnostics.themeState.theme || 'undefined'}</div>
              </div>
              <div>
                <div className="text-gray-600 dark:text-gray-400 mb-1">resolved</div>
                <div className="font-mono text-foreground">{diagnostics.themeState.resolvedTheme || 'undefined'}</div>
              </div>
              <div>
                <div className="text-gray-600 dark:text-gray-400 mb-1">system</div>
                <div className="font-mono text-foreground">{diagnostics.themeState.systemTheme || 'undefined'}</div>
              </div>
              <div>
                <div className="text-gray-600 dark:text-gray-400 mb-1">localStorage</div>
                <div className="font-mono text-foreground">{diagnostics.localStorage || 'null'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* HTML Status */}
        <div className="mb-4">
          <h4 className="font-semibold text-green-600 dark:text-green-400 mb-2 flex items-center gap-2">
            <span>📄</span> HTML Element
          </h4>
          <div className="bg-gray-50 dark:bg-slate-800 rounded p-3 border border-gray-200 dark:border-slate-700">
            <div className="space-y-2 text-xs">
              <div>
                <div className="text-gray-600 dark:text-gray-400 mb-1">classes</div>
                <div className="font-mono text-foreground break-all">{diagnostics.htmlClasses || 'none'}</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-gray-600 dark:text-gray-400 mb-1">has 'dark'</div>
                  <div className={`font-mono ${diagnostics.htmlClasses.includes('dark') ? 'text-green-600' : 'text-red-600'}`}>
                    {diagnostics.htmlClasses.includes('dark') ? '✅ YES' : '❌ NO'}
                  </div>
                </div>
                <div>
                  <div className="text-gray-600 dark:text-gray-400 mb-1">has 'light'</div>
                  <div className={`font-mono ${diagnostics.themeState.resolvedTheme === 'light' ? 'text-green-600' : 'text-gray-500'}`}>
                    {diagnostics.htmlClasses.includes('light') ? '✅ OK (next-themes default)' : '⚪ NONE'}
                  </div>
                </div>
                <div>
                  <div className="text-gray-600 dark:text-gray-400 mb-1">resolved theme</div>
                  <div className="font-mono text-foreground">
                    {diagnostics.themeState.resolvedTheme || 'undefined'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CSS Variables */}
        <div className="mb-4">
          <h4 className="font-semibold text-purple-600 dark:text-purple-400 mb-2 flex items-center gap-2">
            <span>🎨</span> CSS Variables (Computed)
          </h4>
          <div className="bg-gray-50 dark:bg-slate-800 rounded p-3 border border-gray-200 dark:border-slate-700">
            <div className="space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-gray-600 dark:text-gray-400 mb-1">background</div>
                  <div className="font-mono text-foreground">{diagnostics.cssVariables['--color-background'] || 'MISSING'}</div>
                </div>
                <div>
                  <div className="text-gray-600 dark:text-gray-400 mb-1">surface</div>
                  <div className="font-mono text-foreground">{diagnostics.cssVariables['--color-surface'] || 'MISSING'}</div>
                </div>
                <div>
                  <div className="text-gray-600 dark:text-gray-400 mb-1">foreground</div>
                  <div className="font-mono text-foreground">{diagnostics.cssVariables['--color-foreground'] || 'MISSING'}</div>
                </div>
                <div>
                  <div className="text-gray-600 dark:text-gray-400 mb-1">primary</div>
                  <div className="font-mono text-foreground">{diagnostics.cssVariables['--color-primary'] || 'MISSING'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Component Analysis */}
        <div className="mb-4">
          <h4 className="font-semibold text-cyan-600 dark:text-cyan-400 mb-2 flex items-center gap-2">
            <span>🔍</span> Component Analysis
          </h4>
          <div className="bg-gray-50 dark:bg-slate-800 rounded p-3 border border-gray-200 dark:border-slate-700">
            <div className="space-y-3 text-xs">
              {/* Body */}
              <div>
                <div className="text-gray-600 dark:text-gray-400 mb-1">📄 Body</div>
                <div className="font-mono text-foreground">{diagnostics.componentStyles.body.background}</div>
                <div className="text-gray-500 dark:text-gray-500 text-xs mt-1">Classes: {diagnostics.componentStyles.body.classes}</div>
                <div className={`text-xs mt-1 ${diagnostics.componentStyles.body.background.includes('rgb(248, 250, 252)') ? 'text-green-600' : 'text-red-600'}`}>
                  {diagnostics.componentStyles.body.background.includes('rgb(248, 250, 252)') ? '✅ LIGHT MODE CORRECT' : '❌ DARK IN LIGHT MODE!'}
                </div>
              </div>

              {/* Main */}
              {diagnostics.componentStyles.main && (
                <div>
                  <div className="text-gray-600 dark:text-gray-400 mb-1">📦 Main Container</div>
                  <div className="font-mono text-foreground">{diagnostics.componentStyles.main.background}</div>
                  <div className="text-gray-500 dark:text-gray-500 text-xs mt-1">Classes: {diagnostics.componentStyles.main.classes}</div>
                  <div className={`text-xs mt-1 ${diagnostics.componentStyles.main.background.includes('rgba(0, 0, 0, 0)') || diagnostics.componentStyles.main.background.includes('rgb(255, 255, 255)') ? 'text-green-600' : 'text-red-600'}`}>
                    {diagnostics.componentStyles.main.background.includes('rgba(0, 0, 0, 0)') || diagnostics.componentStyles.main.background.includes('rgb(255, 255, 255)') ? '✅ CORRECT' : '❌ DARK BACKGROUND!'}
                  </div>
                </div>
              )}

              {/* Section */}
              {diagnostics.componentStyles.section && (
                <div>
                  <div className="text-gray-600 dark:text-gray-400 mb-1">📑 First Section</div>
                  <div className="font-mono text-foreground">{diagnostics.componentStyles.section.background}</div>
                  <div className="text-gray-500 dark:text-gray-500 text-xs mt-1">Classes: {diagnostics.componentStyles.section.classes}</div>
                  <div className={`text-xs mt-1 ${diagnostics.componentStyles.section.background.includes('rgb(255, 255, 255)') || diagnostics.componentStyles.section.background.includes('rgb(248, 250, 252)') ? 'text-green-600' : 'text-red-600'}`}>
                    {diagnostics.componentStyles.section.background.includes('rgb(255, 255, 255)') || diagnostics.componentStyles.section.background.includes('rgb(248, 250, 252)') ? '✅ LIGHT MODE CORRECT' : '❌ DARK IN LIGHT MODE!'}
                  </div>
                </div>
              )}

              {/* Card */}
              {diagnostics.componentStyles.card && (
                <div>
                  <div className="text-gray-600 dark:text-gray-400 mb-1">🃏 First Card</div>
                  <div className="font-mono text-foreground">{diagnostics.componentStyles.card.background}</div>
                  <div className="text-gray-500 dark:text-gray-500 text-xs mt-1">Classes: {diagnostics.componentStyles.card.classes}</div>
                  <div className={`text-xs mt-1 ${diagnostics.componentStyles.card.background.includes('rgb(255, 255, 255)') ? 'text-green-600' : 'text-red-600'}`}>
                    {diagnostics.componentStyles.card.background.includes('rgb(255, 255, 255)') ? '✅ WHITE CORRECT' : '❌ DARK CARD!'}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navbar Analysis */}
        {diagnostics.navbarStyles && (
          <div className="mb-4">
            <h4 className="font-semibold text-orange-600 dark:text-orange-400 mb-2 flex items-center gap-2">
              <span>📊</span> Navbar Computed Styles
            </h4>
            <div className="bg-gray-50 dark:bg-slate-800 rounded p-3 border border-gray-200 dark:border-slate-700">
              <div className="space-y-2 text-xs">
                <div>
                  <div className="text-gray-600 dark:text-gray-400 mb-1">background</div>
                  <div className="font-mono text-foreground">{diagnostics.navbarStyles.backgroundColor}</div>
                </div>
                <div>
                  <div className="text-gray-600 dark:text-gray-400 mb-1">color</div>
                  <div className="font-mono text-foreground">{diagnostics.navbarStyles.color}</div>
                </div>
                <div>
                  <div className="text-gray-600 dark:text-gray-400 mb-1">border</div>
                  <div className="font-mono text-foreground">{diagnostics.navbarStyles.borderColor}</div>
                </div>
                <div>
                  <div className="text-gray-600 dark:text-gray-400 mb-1">classes</div>
                  <div className="font-mono text-foreground break-all">{diagnostics.navbarStyles.classes}</div>
                </div>
                <div>
                  <div className="text-gray-600 dark:text-gray-400 mb-1">inline</div>
                  <div className="font-mono text-foreground">{diagnostics.navbarStyles.inlineStyles}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Diagnostics Summary */}
        {diagnostics.diagnostics && (
          <div className="mb-4">
            <h4 className="font-semibold text-emerald-600 dark:text-emerald-400 mb-2 flex items-center gap-2">
              <span>📊</span> تحليل مفصل للثيم
            </h4>
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded p-3 border border-emerald-200 dark:border-emerald-800">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <div className="text-gray-600 dark:text-gray-400 mb-1">تطابق الثيم</div>
                  <div className={`font-mono font-medium ${diagnostics.diagnostics.themeConsistency.status === 'critical' ? 'text-red-600' :
                    diagnostics.diagnostics.themeConsistency.status === 'warning' ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                    {diagnostics.diagnostics.themeConsistency.status === 'critical' ? '🔴 حرج' :
                      diagnostics.diagnostics.themeConsistency.status === 'warning' ? '🟡 تحذير' :
                        '🟢 صحيح'}
                  </div>
                </div>
                <div>
                  <div className="text-gray-600 dark:text-gray-400 mb-1">متغيرات CSS</div>
                  <div className={`font-mono font-medium ${diagnostics.diagnostics.cssVariables.status === 'critical' ? 'text-red-600' :
                    diagnostics.diagnostics.cssVariables.status === 'warning' ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                    {diagnostics.diagnostics.cssVariables.status === 'critical' ? '🔴 حرج' :
                      diagnostics.diagnostics.cssVariables.status === 'warning' ? '🟡 تحذير' :
                        '🟢 صحيح'}
                  </div>
                </div>
                <div>
                  <div className="text-gray-600 dark:text-gray-400 mb-1">أنماط المكونات</div>
                  <div className={`font-mono font-medium ${diagnostics.diagnostics.componentStyles.status === 'critical' ? 'text-red-600' :
                    diagnostics.diagnostics.componentStyles.status === 'warning' ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                    {diagnostics.diagnostics.componentStyles.status === 'critical' ? '🔴 حرج' :
                      diagnostics.diagnostics.componentStyles.status === 'warning' ? '🟡 تحذير' :
                        '🟢 صحيح'}
                  </div>
                </div>
                <div>
                  <div className="text-gray-600 dark:text-gray-400 mb-1">الأداء</div>
                  <div className={`font-mono font-medium ${diagnostics.diagnostics.performance.status === 'critical' ? 'text-red-600' :
                    diagnostics.diagnostics.performance.status === 'warning' ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                    {diagnostics.diagnostics.performance.status === 'critical' ? '🔴 حرج' :
                      diagnostics.diagnostics.performance.status === 'warning' ? '🟡 تحذير' :
                        '🟢 صحيح'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recommendations */}
        {diagnostics.diagnostics && diagnostics.diagnostics.recommendations.length > 0 && (
          <div className="mb-4">
            <h4 className="font-semibold text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-2">
              <span>💡</span> التوصيات
              <span className="ml-auto text-xs text-gray-500">
                ({diagnostics.diagnostics.recommendations.length} توصية)
              </span>
            </h4>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-3 border border-blue-200 dark:border-blue-800">
              <div className="space-y-2 max-h-32 overflow-auto text-xs">
                {diagnostics.diagnostics.recommendations.map((rec, index) => (
                  <div key={index} className="text-blue-700 dark:text-blue-300 flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Issues */}
        <div className="mb-4">
          <h4 className="font-semibold text-red-600 dark:text-red-400 mb-2 flex items-center gap-2">
            <span>🔍</span> المشاكل المكتشفة
            <span className="ml-auto text-xs text-gray-500">
              ({diagnostics.issues.length} {diagnostics.issues.length === 1 ? 'مشكلة' : 'مشاكل'})
            </span>
          </h4>
          <div className="bg-red-50 dark:bg-red-900/20 rounded p-3 border border-red-200 dark:border-red-800">
            <div className="space-y-1 max-h-32 overflow-auto text-xs">
              {diagnostics.issues.length === 0 ? (
                <div className="text-green-600 dark:text-green-400 font-medium">✅ جميع أنظمة الثيم تعمل بشكل صحيح</div>
              ) : (
                diagnostics.issues.map((issue, index) => (
                  <div key={index} className={`${issue.includes('🚨 CRITICAL') ? 'text-red-700 dark:text-red-300 font-medium' :
                    issue.includes('⚠️') ? 'text-yellow-700 dark:text-yellow-300' :
                      issue.includes('🔧') ? 'text-blue-700 dark:text-blue-300' :
                        'text-gray-700 dark:text-gray-300'
                    }`}>
                    {issue}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Professional Debugging Tools */}
        <div className="space-y-3 pt-3 border-t border-gray-200 dark:border-slate-700">
          <h4 className="font-semibold text-red-600 dark:text-red-400 mb-2 flex items-center justify-between">
            <span>🔬 أدوات تشخيص احترافية للكشف عن مشاكل الوضع المظلم</span>
            {diagnostics.professionalTools && Object.keys(diagnostics.professionalTools).length > 0 && (
              <span className="text-xs bg-green-500 text-white px-2 py-1 rounded">
                {Object.keys(diagnostics.professionalTools).length} محفوظ
              </span>
            )}
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={analyzeTailwindConfig}
              className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-xs font-medium transition-colors"
              title="Check Tailwind config darkMode setting"
            >
              🎨 Tailwind Config
            </button>
            <button
              onClick={scanDOMForDarkClasses}
              className="px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-xs font-medium transition-colors"
              title="Scan entire DOM for elements with 'dark' class"
            >
              🌑 DOM Dark Scan
            </button>
            <button
              onClick={detectCSSMediaQueries}
              className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs font-medium transition-colors"
              title="Detect @media (prefers-color-scheme) rules"
            >
              📱 Media Queries
            </button>
            <button
              onClick={inspectThemeProvider}
              className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-xs font-medium transition-colors"
              title="Inspect ThemeProvider configuration"
            >
              🎭 ThemeProvider
            </button>
            <button
              onClick={detectCSSOverrides}
              className="px-3 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 text-xs font-medium transition-colors"
              title="Find hardcoded dark colors in CSS"
            >
              🎨 CSS Overrides
            </button>
            <button
              onClick={analyzeTailwindDarkMode}
              className="px-3 py-2 bg-pink-600 text-white rounded hover:bg-pink-700 text-xs font-medium transition-colors col-span-2"
              title="Comprehensive Tailwind dark mode trigger analysis"
            >
              🌙 Dark Mode Trigger Analysis
            </button>
          </div>
        </div>

        {/* Saved Professional Tool Results */}
        {diagnostics.professionalTools && Object.keys(diagnostics.professionalTools).length > 0 && (
          <div className="space-y-3 pt-3 border-t border-gray-200 dark:border-slate-700">
            <h4 className="font-semibold text-green-600 dark:text-green-400 mb-2">💾 النتائج المحفوظة من الأدوات المهنية</h4>
            <div className="bg-green-50 dark:bg-green-900/20 rounded p-3 border border-green-200 dark:border-green-800 space-y-2">
              {diagnostics.professionalTools.tailwindConfig && (
                <div className="flex items-center justify-between text-xs">
                  <span>🎨 Tailwind Config:</span>
                  <span className={`font-medium ${diagnostics.professionalTools.tailwindConfig.issues.length > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {diagnostics.professionalTools.tailwindConfig.issues.length > 0 ?
                      `${diagnostics.professionalTools.tailwindConfig.issues.length} مشاكل` :
                      'OK'}
                  </span>
                </div>
              )}
              {diagnostics.professionalTools.domDarkScan && (
                <div className="flex items-center justify-between text-xs">
                  <span>🌑 DOM Dark Scan:</span>
                  <span className={`font-medium ${diagnostics.professionalTools.domDarkScan.count > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {diagnostics.professionalTools.domDarkScan.count} عناصر
                  </span>
                </div>
              )}
              {diagnostics.professionalTools.cssMediaQueries && (
                <div className="flex items-center justify-between text-xs">
                  <span>📱 CSS Media Queries:</span>
                  <span className={`font-medium ${diagnostics.professionalTools.cssMediaQueries.count > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                    {diagnostics.professionalTools.cssMediaQueries.count} قواعد
                  </span>
                </div>
              )}
              {diagnostics.professionalTools.themeProvider && (
                <div className="flex items-center justify-between text-xs">
                  <span>🎭 ThemeProvider:</span>
                  <span className={`font-medium ${diagnostics.professionalTools.themeProvider.issues.length > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                    {diagnostics.professionalTools.themeProvider.issues.length > 0 ?
                      `${diagnostics.professionalTools.themeProvider.issues.length} مشاكل` :
                      'OK'}
                  </span>
                </div>
              )}
              {diagnostics.professionalTools.cssOverrides && (
                <div className="flex items-center justify-between text-xs">
                  <span>🎨 CSS Overrides:</span>
                  <span className={`font-medium ${diagnostics.professionalTools.cssOverrides.count > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {diagnostics.professionalTools.cssOverrides.count} ألوان
                  </span>
                </div>
              )}
              {diagnostics.professionalTools.darkModeTrigger && (
                <div className="flex items-center justify-between text-xs">
                  <span>🌙 Dark Mode Trigger:</span>
                  <span className={`font-medium ${diagnostics.professionalTools.darkModeTrigger.potentialTriggers.length > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {diagnostics.professionalTools.darkModeTrigger.potentialTriggers.length} محفزات
                  </span>
                </div>
              )}
              <div className="text-xs text-gray-600 dark:text-gray-400 pt-2 border-t border-green-300 dark:border-green-700">
                ✅ جميع النتائج محفوظة وستُضمن في تقرير "نسخ الديباج"
              </div>
            </div>
          </div>
        )}

        {/* Interactive Tests */}
        <div className="space-y-2 pt-3 border-t border-gray-200 dark:border-slate-700">
          <h4 className="font-semibold text-indigo-600 dark:text-indigo-400 mb-2">🧪 اختبارات تفاعلية متقدمة</h4>

          {/* Run All Diagnostics Button */}
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded p-3 border border-purple-200 dark:border-purple-800 mb-3">
            <button
              onClick={async (e) => {
                e.preventDefault()
                e.stopPropagation()
                console.log('🚀 Running all diagnostics...')
                const notification = document.createElement('div')
                notification.className = 'fixed top-4 left-4 bg-purple-500 text-white px-4 py-2 rounded shadow-lg z-[10000] font-medium'
                notification.textContent = '🚀 تشغيل جميع التشخيصات...'
                document.body.appendChild(notification)
                await runAllProfessionalDiagnostics()
                notification.textContent = '✅ تم تشغيل جميع التشخيصات!'
                notification.className = 'fixed top-4 left-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-[10000] font-medium'
                setTimeout(() => {
                  if (notification.parentNode) {
                    notification.parentNode.removeChild(notification)
                  }
                }, 3000)
              }}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm font-medium transition-colors"
            >
              🚀 تشغيل جميع التشخيصات المهنية
            </button>
            <p className="text-xs text-purple-700 dark:text-purple-300 mt-2">
              يشغل جميع الأدوات المهنية ويحفظ النتائج للتصدير
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={forceDarkClass}
              className="px-3 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 text-xs font-medium transition-colors"
            >
              🌙 Force Dark
            </button>
            <button
              onClick={forceLightClass}
              className="px-3 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-xs font-medium transition-colors"
            >
              ☀️ Force Light
            </button>
            <button
              onClick={testThemeSwitching}
              className="px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-xs font-medium transition-colors"
            >
              🔄 اختبار التبديل
            </button>
            <button
              onClick={validateCSSVariables}
              className="px-3 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700 text-xs font-medium transition-colors"
            >
              🎨 فحص المتغيرات
            </button>
            <button
              onClick={logAllCSSVariables}
              className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs font-medium transition-colors"
            >
              📊 Log Variables
            </button>
            <button
              onClick={inspectNavbar}
              className="px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-xs font-medium transition-colors"
            >
              🔍 Inspect Navbar
            </button>
            <button
              onClick={testComponentRendering}
              className="px-3 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 text-xs font-medium transition-colors"
            >
              🧩 فحص المكونات
            </button>
            <button
              onClick={copyAllDebugContent}
              className="px-3 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 text-xs font-medium transition-colors"
              title="Exports complete diagnostic data including all professional tools results"
            >
              📋 نسخ التشخيص الكامل
            </button>
            <button
              onClick={clearLocalStorage}
              className="px-3 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 text-xs font-medium transition-colors"
            >
              🗑️ مسح LocalStorage
            </button>
            <button
              onClick={reloadTheme}
              className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-xs font-medium transition-colors col-span-1"
            >
              🔄 Reload Page
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
