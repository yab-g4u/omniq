import { Language } from '../types';

export interface VesperPhrase {
  category: 'greetings' | 'questions' | 'clarification' | 'missing_information' | 'evidence_requests' | 'closing';
  subCategory: string;
  language: Language;
  phraseText: string;
  intentDescription: string;
}

export const VESPER_PHRASE_LIBRARY: VesperPhrase[] = [
  // Greetings
  {
    category: 'greetings',
    subCategory: 'welcome',
    language: 'am',
    phraseText: 'እንኳን ወደ 8800 የነፃ የንግድ ብድር አገልግሎት በደህና መጡ። እኔ ቬስፐር ነኝ፤ የብድር ማመልከቻዎን ለማዘጋጀት እረዳዎታለሁ።',
    intentDescription: 'Toll-free IVR opening greeting in Amharic',
  },
  {
    category: 'greetings',
    subCategory: 'welcome',
    language: 'om',
    phraseText: 'Baga gara tajaajila liqii bilisaa 8800 nagaan dhuftan. Ani Vesper dha; iyyannoo liqii keessan qopheessuuf isin gargaara.',
    intentDescription: 'Toll-free IVR opening greeting in Afaan Oromo',
  },
  {
    category: 'greetings',
    subCategory: 'welcome',
    language: 'en',
    phraseText: 'Welcome to the 8800 Toll-Free Business Funding Hotline. I am Vesper, your voice underwriting assistant.',
    intentDescription: 'Toll-free IVR opening greeting in English',
  },
  {
    category: 'greetings',
    subCategory: 'language_confirm',
    language: 'am',
    phraseText: 'በአማርኛ ንግግራችንን እንቀጥላለን። እባክዎ የንግድ ስራዎን ስም እና የስራዎን ዘርፍ ይንገሩን።',
    intentDescription: 'Language confirmation and initial question (Amharic)',
  },
  {
    category: 'greetings',
    subCategory: 'language_confirm',
    language: 'om',
    phraseText: 'Afaan Oromootiin itti fufna. Maaloo maqaa daldala keessaniifi gosa hojii keessanii nuu himaa.',
    intentDescription: 'Language confirmation and initial question (Oromo)',
  },
  {
    category: 'greetings',
    subCategory: 'language_confirm',
    language: 'en',
    phraseText: 'We will proceed in English. Please state your registered business name and industry sector.',
    intentDescription: 'Language confirmation and initial question (English)',
  },

  // Questions
  {
    category: 'questions',
    subCategory: 'business_name',
    language: 'am',
    phraseText: 'የድርጅትዎ ወይም የንግድ ሱቅዎ ትክክለኛ መጠሪያ ስም ማን ይባላል?',
    intentDescription: 'Asking for business trade name',
  },
  {
    category: 'questions',
    subCategory: 'business_name',
    language: 'om',
    phraseText: 'Maqaan daldala ykn suuqii keessanii maaldha?',
    intentDescription: 'Asking for business trade name in Oromo',
  },
  {
    category: 'questions',
    subCategory: 'business_name',
    language: 'en',
    phraseText: 'What is the official or trade name of your business?',
    intentDescription: 'Asking for business trade name in English',
  },
  {
    category: 'questions',
    subCategory: 'business_type',
    language: 'am',
    phraseText: 'የሚሰሩት የስራ ዘርፍ ምንድን ነው? ለምሳሌ ጨርቃጨርቅ፣ ብረት ስራ፣ ቡና ማቀነባበር ወይስ ንግድ?',
    intentDescription: 'Asking for sector/activity in Amharic',
  },
  {
    category: 'questions',
    subCategory: 'business_type',
    language: 'om',
    phraseText: 'Gosti hojii keessanii maali? Fakkeenyaaf qophii bunaa, huccuu hodhuu, hojii sibilaa moo daldala biroo?',
    intentDescription: 'Asking for sector/activity in Oromo',
  },
  {
    category: 'questions',
    subCategory: 'business_type',
    language: 'en',
    phraseText: 'What is your primary line of business or production sector?',
    intentDescription: 'Asking for sector/activity in English',
  },
  {
    category: 'questions',
    subCategory: 'business_start_date',
    language: 'am',
    phraseText: 'ይህን ስራ ከጀመሩ ምን ያህል ጊዜ ሆነዎት? የተጀመረበትን ዓመተ ምህረት ሊነግሩን ይችላሉ?',
    intentDescription: 'Asking for operational longevity in Amharic',
  },
  {
    category: 'questions',
    subCategory: 'business_start_date',
    language: 'om',
    phraseText: "Hojii kana erga eegaltanii yeroo hammamii ta'e? Bara kam eegaltan?",
    intentDescription: 'Asking for operational longevity in Oromo',
  },
  {
    category: 'questions',
    subCategory: 'business_start_date',
    language: 'en',
    phraseText: 'When did you establish or start operating this business?',
    intentDescription: 'Asking for operational longevity in English',
  },
  {
    category: 'questions',
    subCategory: 'location_description',
    language: 'am',
    phraseText: 'የስራ ቦታዎ ወይም ዎርክሾፕዎ የት ከተማና ክፍለ ከተማ ወይም ቀበሌ ነው የሚገኘው?',
    intentDescription: 'Asking for geographical location in Amharic',
  },
  {
    category: 'questions',
    subCategory: 'location_description',
    language: 'om',
    phraseText: 'Bakki hojii ykn suuqiin keessan magaalaa kam, aanaa fi ganda kamitti argama?',
    intentDescription: 'Asking for geographical location in Oromo',
  },
  {
    category: 'questions',
    subCategory: 'location_description',
    language: 'en',
    phraseText: 'Where is your shop or production facility located? Please include city and sub-city or kebele.',
    intentDescription: 'Asking for geographical location in English',
  },
  {
    category: 'questions',
    subCategory: 'num_employees',
    language: 'am',
    phraseText: 'በአሁኑ ሰዓት ቋሚ እና ጊዜያዊ ስንት ሰራተኞች አሉዎት?',
    intentDescription: 'Asking employee count in Amharic',
  },
  {
    category: 'questions',
    subCategory: 'num_employees',
    language: 'om',
    phraseText: 'Yeroo ammaa hojjettoota dhaabbataa fi yeroo meeqa qabdu?',
    intentDescription: 'Asking employee count in Oromo',
  },
  {
    category: 'questions',
    subCategory: 'num_employees',
    language: 'en',
    phraseText: 'How many full-time and part-time workers do you employ?',
    intentDescription: 'Asking employee count in English',
  },
  {
    category: 'questions',
    subCategory: 'monthly_or_annual_sales',
    language: 'am',
    phraseText: 'በአማካይ በወር ወይም በዓመት ምን ያህል የብር ሽያጭ ገቢ ያገኛሉ?',
    intentDescription: 'Asking monthly/annual turnover in Amharic',
  },
  {
    category: 'questions',
    subCategory: 'monthly_or_annual_sales',
    language: 'om',
    phraseText: "Giddugaleessaan ji'atti ykn waggaatti galii Birrii meeqaa argattu?",
    intentDescription: 'Asking monthly/annual turnover in Oromo',
  },
  {
    category: 'questions',
    subCategory: 'monthly_or_annual_sales',
    language: 'en',
    phraseText: 'What is your average monthly or annual revenue in Ethiopian Birr?',
    intentDescription: 'Asking monthly/annual turnover in English',
  },
  {
    category: 'questions',
    subCategory: 'machinery_equipment',
    language: 'am',
    phraseText: 'ለስራዎ የሚጠቀሙባቸው ዋና ዋና ማሽኖች፣ እቃዎች ወይም ተሸከርካሪዎች ምን ምን ናቸው?',
    intentDescription: 'Asking productive equipment in Amharic',
  },
  {
    category: 'questions',
    subCategory: 'machinery_equipment',
    language: 'om',
    phraseText: 'Meeshaalee, maashinoota ykn meeshaalee oomishaa akkamii qabdu?',
    intentDescription: 'Asking productive equipment in Oromo',
  },
  {
    category: 'questions',
    subCategory: 'machinery_equipment',
    language: 'en',
    phraseText: 'What machinery, tools, vehicles, or physical equipment do you own and operate?',
    intentDescription: 'Asking productive equipment in English',
  },
  {
    category: 'questions',
    subCategory: 'funding_amount_requested',
    language: 'am',
    phraseText: 'ለስራዎ ማስፋፊያ ምን ያህል የብድር ገንዘብ ይፈልጋሉ?',
    intentDescription: 'Asking requested loan amount in Amharic',
  },
  {
    category: 'questions',
    subCategory: 'funding_amount_requested',
    language: 'om',
    phraseText: "Daldala keessan babal'isuuf maallaqa liqii Birrii meeqa barbaaddu?",
    intentDescription: 'Asking requested loan amount in Oromo',
  },
  {
    category: 'questions',
    subCategory: 'funding_amount_requested',
    language: 'en',
    phraseText: 'How much funding or credit facility are you requesting today?',
    intentDescription: 'Asking requested loan amount in English',
  },
  {
    category: 'questions',
    subCategory: 'funding_purpose',
    language: 'am',
    phraseText: 'የሚወስዱትን የብድር ገንዘብ ለምን አይነት ግዢ ወይም ማስፋፊያ ለማዋል ነው ያቀዱት?',
    intentDescription: 'Asking use of loan funds in Amharic',
  },
  {
    category: 'questions',
    subCategory: 'funding_purpose',
    language: 'om',
    phraseText: "Maallaqa liqichaa maaliif oolchuuf karoorsitan? Meeshaa bituuf moo iddoo babal'isuuf?",
    intentDescription: 'Asking use of loan funds in Oromo',
  },
  {
    category: 'questions',
    subCategory: 'funding_purpose',
    language: 'en',
    phraseText: 'Specifically how will this capital be invested in your enterprise?',
    intentDescription: 'Asking use of loan funds in English',
  },
  {
    category: 'questions',
    subCategory: 'beneficiaries_impact',
    language: 'am',
    phraseText: 'ይህ ብድር ቢፈቀድልዎት ስንት አዲስ የስራ እድል ይፈጥራሉ? በማህበረሰቡ ላይስ ምን ጥቅም አለው?',
    intentDescription: 'Asking impact and job creation in Amharic',
  },
  {
    category: 'questions',
    subCategory: 'beneficiaries_impact',
    language: 'om',
    phraseText: "Liqiin kun yoo eeyyamame carraa hojii haaraa meeqa uuma? Hawaasa naannoof bu'aa akkamii qaba?",
    intentDescription: 'Asking impact and job creation in Oromo',
  },
  {
    category: 'questions',
    subCategory: 'beneficiaries_impact',
    language: 'en',
    phraseText: 'How many additional jobs will be created, and what community impact will be achieved?',
    intentDescription: 'Asking impact and job creation in English',
  },

  // Clarification
  {
    category: 'clarification',
    subCategory: 'repeat_amount',
    language: 'am',
    phraseText: 'ይቅርታ፣ የጠየቁትን የብድር መጠን በድጋሚ ግልጽ አድርገው ሊነግሩን ይችላሉ?',
    intentDescription: 'Clarifying ambiguous loan amount in Amharic',
  },
  {
    category: 'clarification',
    subCategory: 'repeat_amount',
    language: 'om',
    phraseText: 'Dhiifama, hamma maallaqa liqii barbaaddan irra deebitanii nuu himuu dandeessuu?',
    intentDescription: 'Clarifying ambiguous loan amount in Oromo',
  },
  {
    category: 'clarification',
    subCategory: 'repeat_amount',
    language: 'en',
    phraseText: 'Could you please repeat or clarify the exact loan amount in Ethiopian Birr?',
    intentDescription: 'Clarifying ambiguous loan amount in English',
  },
  {
    category: 'clarification',
    subCategory: 'confirm_location',
    language: 'am',
    phraseText: 'የስራ ቦታዎ በትክክል የት አካባቢ እንደሆነ በድጋሚ ያረጋግጡልን?',
    intentDescription: 'Confirming shop/facility address in Amharic',
  },
  {
    category: 'clarification',
    subCategory: 'confirm_location',
    language: 'om',
    phraseText: "Iddoon hojii keessan sirriitti eessa akka ta'e irra deebi'aa nuu mirkaneessaa?",
    intentDescription: 'Confirming shop/facility address in Oromo',
  },
  {
    category: 'clarification',
    subCategory: 'confirm_location',
    language: 'en',
    phraseText: 'Could you confirm the exact neighborhood or street landmark of your facility?',
    intentDescription: 'Confirming shop/facility address in English',
  },

  // Missing Information
  {
    category: 'missing_information',
    subCategory: 'prompt_sales',
    language: 'am',
    phraseText: 'እስካሁን የወር ወይም የዓመት የገቢ መጠንዎን አልገለጹልንም፤ በወር በአማካይ ምን ያህል ብር ያስገባሉ?',
    intentDescription: 'Prompting for missing revenue in Amharic',
  },
  {
    category: 'missing_information',
    subCategory: 'prompt_sales',
    language: 'om',
    phraseText: "Hamma galii ji'aa keessanii hin ibsine; giddugaleessaan ji'atti Birrii meeqa argattu?",
    intentDescription: 'Prompting for missing revenue in Oromo',
  },
  {
    category: 'missing_information',
    subCategory: 'prompt_sales',
    language: 'en',
    phraseText: "We haven't noted your revenue yet; what is your typical monthly income?",
    intentDescription: 'Prompting for missing revenue in English',
  },
  {
    category: 'missing_information',
    subCategory: 'prompt_machinery',
    language: 'am',
    phraseText: 'ለስራ የሚጠቀሙባቸው ማሽኖች ወይም ቁሳቁሶች ካሉዎት እባክዎ ይጥቀሱልን።',
    intentDescription: 'Prompting for missing equipment in Amharic',
  },
  {
    category: 'missing_information',
    subCategory: 'prompt_machinery',
    language: 'om',
    phraseText: 'Meeshaalee ykn maashinoota hojiif itti fayyadamtamu qabdu yoo ta\'e nuu ibsaa.',
    intentDescription: 'Prompting for missing equipment in Oromo',
  },
  {
    category: 'missing_information',
    subCategory: 'prompt_machinery',
    language: 'en',
    phraseText: 'Please mention any physical machinery or productive equipment you operate.',
    intentDescription: 'Prompting for missing equipment in English',
  },

  // Evidence Requests
  {
    category: 'evidence_requests',
    subCategory: 'kebele_id',
    language: 'am',
    phraseText: 'የብድር ማመልከቻዎን ለማጠናቀቅ የቀበሌ መታወቂያ እና የታደሰ የንግድ ፈቃድ ማቅረብ ይጠበቅብዎታል።',
    intentDescription: 'Explaining evidence requirements in Amharic',
  },
  {
    category: 'evidence_requests',
    subCategory: 'kebele_id',
    language: 'om',
    phraseText: 'Iyyannoo kana xumuruuf waraqaa eenyummaa gandaa fi heeyyama daldalaa qopheessuun barbaachisaadha.',
    intentDescription: 'Explaining evidence requirements in Oromo',
  },
  {
    category: 'evidence_requests',
    subCategory: 'kebele_id',
    language: 'en',
    phraseText: 'Please note that a Kebele national ID and physical premises verification will be required before disbursement.',
    intentDescription: 'Explaining evidence requirements in English',
  },
  {
    category: 'evidence_requests',
    subCategory: 'site_visit',
    language: 'am',
    phraseText: 'የብድር መኮንኖቻችን ዎርክሾፕዎን በአካል መጥተው ለመጎብኘት ቀጠሮ ይይዛሉ።',
    intentDescription: 'Informing about physical field visit in Amharic',
  },
  {
    category: 'evidence_requests',
    subCategory: 'site_visit',
    language: 'om',
    phraseText: 'Ogeessi liqii keenya iddoo hojii keessan daawwachuuf bilbilaan isin qunnama.',
    intentDescription: 'Informing about physical field visit in Oromo',
  },
  {
    category: 'evidence_requests',
    subCategory: 'site_visit',
    language: 'en',
    phraseText: 'A field credit officer will schedule an on-site visit to inspect your equipment.',
    intentDescription: 'Informing about physical field visit in English',
  },

  // Closing
  {
    category: 'closing',
    subCategory: 'completed_success',
    language: 'am',
    phraseText: 'እናመሰግናለን! የንግድ ስራ ማመልከቻዎ በተሟላ ሁኔታ ተመዝግቧል። የብድር ውሳኔውን በስልክዎ በአጭር የጽሁፍ መልዕክት (SMS) እንልክልዎታለን።',
    intentDescription: 'Final closing and confirmation in Amharic',
  },
  {
    category: 'closing',
    subCategory: 'completed_success',
    language: 'om',
    phraseText: "Galatoomaa! Iyyannoon daldala keessanii guutummaatti galmaa'eera. Murtee liqii ergaa gabaabaa (SMS) bilbila keessaniin isiniif ergina.",
    intentDescription: 'Final closing and confirmation in Oromo',
  },
  {
    category: 'closing',
    subCategory: 'completed_success',
    language: 'en',
    phraseText: 'Thank you! Your business funding application has been recorded and submitted to underwriting. You will receive an SMS confirmation shortly.',
    intentDescription: 'Final closing and confirmation in English',
  },
];

export function getApprovedPhrase(
  category: VesperPhrase['category'],
  subCategory: string,
  language: Language
): string | undefined {
  const match = VESPER_PHRASE_LIBRARY.find(
    (p) => p.category === category && p.subCategory === subCategory && p.language === language
  );
  return match?.phraseText;
}
