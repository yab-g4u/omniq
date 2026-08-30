import { Language } from '../types';

export const GREETINGS: Record<Language, string> = {
  am: 'እንኳን ወደ ሴኳ (Sequa SME) የብድር አገልግሎት በደህና መጡ። ዛሬ የንግድዎን ታሪክ ሰምቼ የብድር ማመልከቻዎን አብረን እናዘጋጃለን።',
  om: "Baga gara tajaajila liqii Sequa SME nagaan dhuftan. Akkam jirtu? Har'a waan daldala keessanii mari'achuun iyyannoo keessan waliin qopheessina.",
  en: "Welcome to Sequa SME Support. I'm here to listen to your story and help you prepare your credit application today.",
};

export const ELIGIBILITY_QUESTIONS: Record<Language, { 1: string; 2: string }> = {
  am: {
    1: 'በመጀመሪያ ደረጃ፣ ንግድዎ በኢትዮጵያ በሕጋዊ መንገድ የተመዘገበ ነው?',
    2: 'በጣም ጥሩ! ለመሆኑ ንግድዎን ከጀመሩ ቢያንስ ሁለት ዓመት አልፎታል?',
  },
  om: {
    1: "Jalqqaba irratti, daldalli keessan Itoophiyaa keessatti seeraan kan galmaa'edha?",
    2: "Baga gammaddan! Akkasumas daldala keessan hojjechiisuu erga eegaltanii yoo xiqqaate waggaa lama ta'eeraa?",
  },
  en: {
    1: 'To start off, is your business legally registered in Ethiopia?',
    2: 'That is great! And has your business been operating for at least two years?',
  },
};

export const ELIGIBILITY_RESPONSES: Record<Language, { true: string; false: string }> = {
  am: {
    true: 'እንኳን ደስ አለዎት! የመጀመሪያ ደረጃ ብቁነትን አሟልተዋል። አሁን ስለ ንግድዎ፣ ገቢዎ እና የብድር ፍላጎትዎ በዝርዝር እንነጋገር።',
    false: 'ስለሰጡን መረጃ እናመሰግናለን። ይቅርታ፣ ለአሁኑ የብድር መስፈርት ማሟላት አልተቻለም። መልካም የስራ ጊዜ ይሁንልዎት።',
  },
  om: {
    true: "Baga gammaddan! Ulaagaa calallii jalqabaa guuttaniirtu. Amma waa'ee daldala keessaniifi hamma maallaqa barbaaddanii bal'inaan mari'anna.",
    false: 'Waan nuu ibsitaniif galatoomaa. Dhiifama, ulaagaa liqii ammaa ulaagaan hin guutamne. Guyyaa gaarii qabaadhaa.',
  },
  en: {
    true: "Wonderful news! Your business meets our initial eligibility criteria. Let's now discuss your enterprise operations, revenue, and funding needs.",
    false: 'Thank you for providing your information. Unfortunately, your business does not currently meet our minimum eligibility criteria. Wishing you great success!',
  },
};

export function getGreeting(language: Language): string {
  return GREETINGS[language] || GREETINGS.am;
}

export function getEligibilityQuestion(language: Language, questionNumber: 1 | 2): string {
  const langQuestions = ELIGIBILITY_QUESTIONS[language] || ELIGIBILITY_QUESTIONS.am;
  return langQuestions[questionNumber];
}

export function getEligibilityResponse(language: Language, isEligible: boolean): string {
  const langResponses = ELIGIBILITY_RESPONSES[language] || ELIGIBILITY_RESPONSES.am;
  return isEligible ? langResponses.true : langResponses.false;
}

/**
 * Natural Ethiopian speech understanding for Question 1 (Registration).
 */
export function evaluateRegistrationAnswer(text: string): boolean | null {
  const lower = text.toLowerCase().trim();

  const positiveMarkers = [
    'አዎ', 'አዎን', 'ተመዝግበናል', 'አዎ ተመዝግበናል', 'አዎ ተመዝግቧል', 'ሕጋዊ ነው', 'ሕጋዊ', 'ፈቃድ አለን', 'ፈቃድ',
    'yes', 'yeah', 'yep', 'sure', 'registered', 'we are registered', "we're registered", 'legally', 'licensed',
    'eyyee', 'galmaa\'eera', 'galmaa\'aa', 'seeraan', 'heeyyama'
  ];

  const negativeMarkers = [
    'አይ', 'አይደለም', 'አልተመዘገበም', 'አልተመዘገብንም', 'ገና ነው', 'ፈቃድ የለንም',
    'no', 'nope', 'not registered', 'unregistered', 'not yet', 'no license',
    'lakki', 'hinoolle', 'hin galmaa\'ine'
  ];

  for (const marker of negativeMarkers) {
    if (lower.includes(marker)) return false;
  }

  for (const marker of positiveMarkers) {
    if (lower.includes(marker)) return true;
  }

  return null;
}

/**
 * Natural Ethiopian speech understanding for Question 2 (Longevity >= 2 years).
 */
export function evaluateYearsOperatingAnswer(text: string): boolean | null {
  const lower = text.toLowerCase().trim();

  const explicitIneligible = [
    '1 year', 'one year', '6 month', 'six month', '3 month', 'three month', 'started last year', 'just started',
    'አንድ ዓመት', '1 ዓመት', '6 ወር', 'ስድስት ወር', 'አይ', 'አይደለም', 'ገና 1', 'ገና አንድ', 'አዲስ ነው',
    'waggaa 1', 'waggaa tokko', 'ji\'a'
  ];

  for (const marker of explicitIneligible) {
    if (lower.includes(marker)) return false;
  }

  const explicitEligible = [
    '2', '3', '4', '5', '6', '7', '8', '9', '10',
    'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
    'ሁለት', 'ሦስት', 'ሶስት', 'አራት', 'አምስት', 'ስድስት', 'ሰባት', 'ስምንት', 'ዘጠኝ', 'አሥር', 'አስር',
    'አዎ', 'አዎን', 'ቆይቷል', 'ከሁለት ዓመት', 'ከ3 ዓመት', 'ከሶስት ዓመት', 'ብዙ ዓመት',
    'yes', 'yeah', 'yep', 'operating', 'years', 'waggaa lama', 'waggaa sadii'
  ];

  for (const marker of explicitEligible) {
    if (lower.includes(marker)) return true;
  }

  return null;
}
