import { Language } from '../types';

export const GREETINGS: Record<Language, string> = {
  am: 'እንኳን ወደ ሴኳ ኤስ.ኤም.ኢ (Sequa SME) የብድር ድጋፍ አገልግሎት በደህና መጡ። እኔ የብድር መገምገሚያ ረዳትዎ ነኝ።',
  om: "Baga gara tajaajila liqii Sequa SME nagaan dhuftan. Ani ogeessa iyyannoo liqii keessan mirkaneessudha.",
  en: 'Welcome to Sequa SME Support. I am your automated credit assessment assistant.',
};

export const ELIGIBILITY_QUESTIONS: Record<Language, { 1: string; 2: string }> = {
  am: {
    1: 'ንግድዎ በኢትዮጵያ በሕጋዊ መንገድ የተመዘገበ ነው?',
    2: 'ንግድዎ ቢያንስ ለሁለት ዓመታት ሲሰራ ቆይቷል?',
  },
  om: {
    1: "Daldalli keessan Itoophiyaa keessatti seeraan kan galmaa'edha?",
    2: "Daldalli keessan yoo xiqqaate waggaa lamaaf hojjechaa tureeraa?",
  },
  en: {
    1: 'Is your business legally registered in Ethiopia?',
    2: 'Has your business been operating for at least two years?',
  },
};

export const ELIGIBILITY_RESPONSES: Record<Language, { true: string; false: string }> = {
  am: {
    true: 'እንኳን ደስ አለዎት! ድርጅትዎ የመጀመሪያ ደረጃ ብቁነትን አሟልቷል። አሁን ስለ ንግድዎ ዝርዝር ሁኔታ እንነጋገራለን።',
    false: 'ይቅርታ፣ ድርጅትዎ ለአሁኑ የብድር መስፈርት አይሟላም። ለተጨማሪ መረጃ እናመሰግናለን፤ መልካም ቀን።',
  },
  om: {
    true: "Baga gammaddan! Daldalli keessan ulaagaa calallii jalqabaa guuteera. Amma waa'ee daldala keessanii bal'inaan mari'anna.",
    false: 'Dhiifama, daldalli keessan ulaagaa liqii ammaa hin guutu. Galatoomaa, guyyaa gaarii.',
  },
  en: {
    true: 'Congratulations! Your business meets our initial eligibility requirements. Let us now discuss your business details.',
    false: 'We are sorry, but your business does not currently meet the eligibility criteria for this credit facility. Thank you for your time and have a great day.',
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
 * Evaluates whether a user's verbal input is affirmative or negative for Question 1 (Registration).
 */
export function evaluateRegistrationAnswer(text: string): boolean | null {
  const lower = text.toLowerCase().trim();

  const positiveMarkers = [
    'አዎ', 'አዎን', 'ተመዝግበናል', 'አዎ ተመዝግበናል', 'አዎ ተመዝግቧል', 'ሕጋዊ ነው', 'ሕጋዊ',
    'yes', 'yeah', 'yep', 'sure', 'registered', 'we are registered', "we're registered", 'legally',
    'eyyee', 'galmaa\'eera', 'galmaa\'aa', 'seeraan'
  ];

  const negativeMarkers = [
    'አይ', 'አይደለም', 'አልተመዘገበም', 'አልተመዘገብንም', 'ገና ነው',
    'no', 'nope', 'not registered', 'unregistered', 'not yet',
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
 * Evaluates whether a user's verbal input indicates years_operating >= 2 for Question 2.
 */
export function evaluateYearsOperatingAnswer(text: string): boolean | null {
  const lower = text.toLowerCase().trim();

  // Explicit negative numbers/phrases (less than 2 years)
  const explicitIneligible = [
    '1 year', 'one year', '6 month', 'six month', '3 month', 'three month', 'started last year',
    'አንድ ዓመት', '1 ዓመት', '6 ወር', 'ስድስት ወር', 'አይ', 'አይደለም', 'ገና 1', 'ገና አንድ',
    'waggaa 1', 'waggaa tokko', 'ji\'a'
  ];

  for (const marker of explicitIneligible) {
    if (lower.includes(marker)) return false;
  }

  // Explicit positive numbers/phrases (>= 2 years)
  const explicitEligible = [
    '2', '3', '4', '5', '6', '7', '8', '9', '10',
    'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
    'ሁለት', 'ሦስት', 'ሶስት', 'አራት', 'አምስት', 'ስድስት', 'ሰባት', 'ስምንት', 'ዘጠኝ', 'አሥር', 'አስር',
    'አዎ', 'አዎን', 'ቆይቷል', 'ከሁለት ዓመት', 'ከ3 ዓመት', 'ከሶስት',
    'yes', 'yeah', 'yep', 'operating', 'years', 'waggaa lama'
  ];

  for (const marker of explicitEligible) {
    if (lower.includes(marker)) return true;
  }

  return null;
}
