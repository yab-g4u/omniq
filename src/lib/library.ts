export type SupportedLanguage = "am" | "en";

export const voiceLibrary = {
  am: {
    greeting:
      "ሰላም፣ ወደ Sequa SME Support እንኳን በደህና መጡ። ስለ ንግድዎ በአጭሩ ይንገሩኝ።",

    eligibility: {
      question1:
        "ንግድዎ በኢትዮጵያ በሕጋዊ መንገድ የተመዘገበ ነው?",

      question2:
        "ንግድዎ ቢያንስ ለሁለት ዓመታት ሲሰራ ቆይቷል?"
    },

    ineligible:
      "ስለሰጡን መረጃ እናመሰግናለን። በአሁኑ ጊዜ የእኛን የገንዘብ ድጋፍ መስፈርት ስለማያሟሉ ማመልከቻዎን መቀጠል አንችልም። መልካም ቀን።",

    eligible:
      "እናመሰግናለን። የመጀመሪያዎቹን መስፈርቶች አሟልተዋል። አሁን ስለ ንግድዎ ተጨማሪ ለማወቅ እንቀጥል።"
  },

  en: {
    greeting:
      "Hello, welcome to Sequa SME Support. Please tell me briefly about your business.",

    eligibility: {
      question1:
        "Is your business legally registered and operating in Ethiopia?",

      question2:
        "Has your business been operating for at least two years?"
    },

    ineligible:
      "Thank you for the information. Unfortunately, you don't currently meet our basic funding eligibility requirements, so we cannot continue with your application. Have a good day.",

    eligible:
      "Thank you. You meet our initial eligibility requirements. Let's continue and learn more about your business."
  }
};

export type EligibilityQuestion = 1 | 2;

export const getGreeting = (language: SupportedLanguage) =>
  voiceLibrary[language].greeting;

export const getEligibilityQuestion = (
  language: SupportedLanguage,
  question: EligibilityQuestion
) =>
  question === 1
    ? voiceLibrary[language].eligibility.question1
    : voiceLibrary[language].eligibility.question2;

export const getEligibilityResponse = (
  language: SupportedLanguage,
  eligible: boolean
) =>
  eligible
    ? voiceLibrary[language].eligible
    : voiceLibrary[language].ineligible;