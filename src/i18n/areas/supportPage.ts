import type { AreaTranslations } from "./types";

/**
 * The "Support the project" page (route /donate). The "why" points follow
 * documentation/WHY_VAULTED_MONEY.md and the README privacy paragraph.
 * Machine-written for es, zh, nl and ta: ask a native speaker to review.
 */
export const supportPage: AreaTranslations = {
  en: {
    supportPage: {
      title: "Support the project",
      subtitle:
        "Vaulted Money is free, open source and private. Supporting it is optional.",
      why: {
        title: "Why Vaulted Money exists",
        affordable:
          "Knowing what you earn, spend and have left shouldn't need a subscription. It's addition, subtraction and honest record-keeping.",
        onDevice:
          "Your money stays on your device. There's no Vaulted Money account and no server to send it to.",
        noTracking: "No ads, no tracking and no selling your data.",
        offline:
          "Works fully offline. AI is optional, off by default, and uses your own key.",
        openSource:
          "Open source under the MIT licence: anyone can read the code, adapt it or translate it.",
      },
      help: {
        title: "Supporting it is optional",
        allFree:
          "Every feature stays free. Paying unlocks nothing extra, and nothing is held back.",
        payOnce:
          "When Vaulted Money goes live in the stores, you can pay once to support solo development. Same app, no subscription.",
        private:
          "Paying never links to your money data. There's no account to link it to.",
        sponsors:
          "Want to help now? GitHub Sponsors takes one-time or monthly support.",
        freeWays:
          "Can't pay? A GitHub star, a bug report or telling a friend helps too.",
        sponsorButton: "Sponsor on GitHub",
        starButton: "Star on GitHub",
      },
      stores: {
        title: "Pay once in a store",
        comingSoon: "Coming soon",
        getIt: "Get it on {{store}}",
        appStore: "iPhone and iPad",
        playStore: "Android phones and tablets",
        polar: "Desktop app for Mac, Windows and Linux",
        note: "Links appear here once each listing is live.",
      },
    },
  },
  es: {
    supportPage: {
      title: "Apoyar el proyecto",
      subtitle:
        "Vaulted Money es gratuito, de código abierto y privado. Apoyarlo es opcional.",
      why: {
        title: "Por qué existe Vaulted Money",
        affordable:
          "Saber cuánto ganas, gastas y te queda no debería requerir una suscripción. Es sumar, restar y llevar cuentas honestas.",
        onDevice:
          "Tu dinero se queda en tu dispositivo. No hay cuenta de Vaulted Money ni servidor al que enviarlo.",
        noTracking: "Sin anuncios, sin rastreo y sin vender tus datos.",
        offline:
          "Funciona totalmente sin conexión. La IA es opcional, está desactivada por defecto y usa tu propia clave.",
        openSource:
          "Código abierto con licencia MIT: cualquiera puede leer el código, adaptarlo o traducirlo.",
      },
      help: {
        title: "Apoyarlo es opcional",
        allFree:
          "Todas las funciones siguen siendo gratuitas. Pagar no desbloquea nada extra y nada se retiene.",
        payOnce:
          "Cuando Vaulted Money esté disponible en las tiendas, podrás pagar una sola vez para apoyar el desarrollo independiente. La misma app, sin suscripción.",
        private:
          "Pagar nunca se vincula con tus datos financieros. No hay ninguna cuenta con la que vincularlo.",
        sponsors:
          "¿Quieres ayudar ya? GitHub Sponsors acepta apoyos únicos o mensuales.",
        freeWays:
          "¿No puedes pagar? Una estrella en GitHub, un informe de error o recomendarlo a alguien también ayuda.",
        sponsorButton: "Patrocinar en GitHub",
        starButton: "Dar una estrella en GitHub",
      },
      stores: {
        title: "Paga una vez en una tienda",
        comingSoon: "Próximamente",
        getIt: "Obtener en {{store}}",
        appStore: "iPhone y iPad",
        playStore: "Teléfonos y tabletas Android",
        polar: "App de escritorio para Mac, Windows y Linux",
        note: "Los enlaces aparecerán aquí cuando cada ficha esté publicada.",
      },
    },
  },
  zh: {
    supportPage: {
      title: "支持本项目",
      subtitle: "Vaulted Money 免费、开源且注重隐私。是否支持完全由你决定。",
      why: {
        title: "Vaulted Money 为什么存在",
        affordable:
          "了解自己的收入、支出和结余，不应该需要订阅。这只是加法、减法和诚实的记账。",
        onDevice:
          "你的财务数据留在你的设备上。没有 Vaulted Money 账户，也没有接收数据的服务器。",
        noTracking: "没有广告，没有跟踪，也不出售你的数据。",
        offline: "完全离线可用。AI 是可选的，默认关闭，并使用你自己的密钥。",
        openSource: "以 MIT 许可证开源：任何人都可以阅读、修改或翻译代码。",
      },
      help: {
        title: "支持是自愿的",
        allFree:
          "所有功能都保持免费。付费不会解锁额外内容，也没有任何功能被保留。",
        payOnce:
          "Vaulted Money 在应用商店上架后，你可以一次性付费，支持独立开发。同一个应用，没有订阅。",
        private: "付费永远不会与你的财务数据关联，因为根本没有可关联的账户。",
        sponsors: "想现在就支持？GitHub Sponsors 接受一次性或按月支持。",
        freeWays:
          "不方便付费？在 GitHub 点个星、报告一个问题或推荐给朋友，同样有帮助。",
        sponsorButton: "在 GitHub 上赞助",
        starButton: "在 GitHub 上加星",
      },
      stores: {
        title: "在应用商店一次性购买",
        comingSoon: "即将推出",
        getIt: "在 {{store}} 获取",
        appStore: "iPhone 和 iPad",
        playStore: "Android 手机和平板",
        polar: "适用于 Mac、Windows 和 Linux 的桌面应用",
        note: "各商店上架后，链接会显示在这里。",
      },
    },
  },
  nl: {
    supportPage: {
      title: "Steun het project",
      subtitle:
        "Vaulted Money is gratis, open source en privé. Steunen is vrijwillig.",
      why: {
        title: "Waarom Vaulted Money bestaat",
        affordable:
          "Weten wat je verdient, uitgeeft en overhoudt zou geen abonnement moeten vereisen. Het is optellen, aftrekken en eerlijk bijhouden.",
        onDevice:
          "Je geld blijft op je apparaat. Er is geen Vaulted Money-account en geen server om het naartoe te sturen.",
        noTracking:
          "Geen advertenties, geen tracking en je gegevens worden niet verkocht.",
        offline:
          "Werkt volledig offline. AI is optioneel, staat standaard uit en gebruikt je eigen sleutel.",
        openSource:
          "Open source onder de MIT-licentie: iedereen kan de code lezen, aanpassen of vertalen.",
      },
      help: {
        title: "Steunen is vrijwillig",
        allFree:
          "Elke functie blijft gratis. Betalen ontgrendelt niets extra's en er wordt niets achtergehouden.",
        payOnce:
          "Zodra Vaulted Money in de stores staat, kun je één keer betalen om de ontwikkeling door één persoon te steunen. Dezelfde app, geen abonnement.",
        private:
          "Betalen wordt nooit gekoppeld aan je financiële gegevens. Er is geen account om het aan te koppelen.",
        sponsors:
          "Wil je nu al helpen? Via GitHub Sponsors kun je eenmalig of maandelijks steunen.",
        freeWays:
          "Kun je niet betalen? Een ster op GitHub, een foutmelding of het doorvertellen helpt ook.",
        sponsorButton: "Sponsor op GitHub",
        starButton: "Ster op GitHub",
      },
      stores: {
        title: "Betaal één keer in een store",
        comingSoon: "Binnenkort",
        getIt: "Downloaden via {{store}}",
        appStore: "iPhone en iPad",
        playStore: "Android-telefoons en -tablets",
        polar: "Desktop-app voor Mac, Windows en Linux",
        note: "Links verschijnen hier zodra elke vermelding live staat.",
      },
    },
  },
  ta: {
    supportPage: {
      title: "திட்டத்தை ஆதரிக்கவும்",
      subtitle:
        "Vaulted Money இலவசமானது, திறந்த மூலமானது, தனியுரிமையானது. ஆதரிப்பது உங்கள் விருப்பம்.",
      why: {
        title: "Vaulted Money ஏன் உருவானது",
        affordable:
          "நீங்கள் எவ்வளவு சம்பாதிக்கிறீர்கள், செலவழிக்கிறீர்கள், மீதி எவ்வளவு என்று அறிய சந்தா தேவைப்படக்கூடாது. இது கூட்டல், கழித்தல், நேர்மையான கணக்கு மட்டுமே.",
        onDevice:
          "உங்கள் பணத் தரவு உங்கள் சாதனத்திலேயே இருக்கும். Vaulted Money கணக்கும் இல்லை, அனுப்ப சேவையகமும் இல்லை.",
        noTracking:
          "விளம்பரங்கள் இல்லை, கண்காணிப்பு இல்லை, உங்கள் தரவு விற்கப்படுவதும் இல்லை.",
        offline:
          "முழுமையாக இணையமின்றி இயங்கும். AI விருப்பத்திற்குரியது, இயல்பாக முடக்கப்பட்டுள்ளது, உங்கள் சொந்த விசையைப் பயன்படுத்துகிறது.",
        openSource:
          "MIT உரிமத்தின் கீழ் திறந்த மூலம்: யார் வேண்டுமானாலும் குறியீட்டைப் படிக்கலாம், மாற்றலாம் அல்லது மொழிபெயர்க்கலாம்.",
      },
      help: {
        title: "ஆதரிப்பது உங்கள் விருப்பம்",
        allFree:
          "எல்லா அம்சங்களும் இலவசமாகவே இருக்கும். பணம் செலுத்துவதால் கூடுதல் எதுவும் திறக்கப்படாது, எதுவும் தடுக்கப்படவும் இல்லை.",
        payOnce:
          "Vaulted Money ஸ்டோர்களில் வெளியானதும், தனி டெவலப்பரின் பணியை ஆதரிக்க ஒருமுறை பணம் செலுத்தலாம். அதே செயலி, சந்தா இல்லை.",
        private:
          "பணம் செலுத்துவது உங்கள் பணத் தரவுடன் ஒருபோதும் இணைக்கப்படாது. இணைக்க எந்தக் கணக்கும் இல்லை.",
        sponsors:
          "இப்போதே உதவ விரும்புகிறீர்களா? GitHub Sponsors ஒருமுறை அல்லது மாதாந்திர ஆதரவை ஏற்கிறது.",
        freeWays:
          "பணம் செலுத்த முடியவில்லையா? GitHub-இல் ஒரு நட்சத்திரம், ஒரு பிழை அறிக்கை அல்லது நண்பரிடம் சொல்வதும் உதவும்.",
        sponsorButton: "GitHub-இல் ஆதரிக்கவும்",
        starButton: "GitHub-இல் நட்சத்திரமிடுங்கள்",
      },
      stores: {
        title: "ஸ்டோரில் ஒருமுறை பணம் செலுத்துங்கள்",
        comingSoon: "விரைவில்",
        getIt: "{{store}}-இல் பெறுக",
        appStore: "iPhone மற்றும் iPad",
        playStore: "Android தொலைபேசிகள் மற்றும் டேப்லெட்டுகள்",
        polar: "Mac, Windows, Linux-க்கான டெஸ்க்டாப் செயலி",
        note: "ஒவ்வொரு பட்டியலும் வெளியானதும் இணைப்புகள் இங்கே தோன்றும்.",
      },
    },
  },
};
