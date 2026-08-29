import { Language } from '../types';

export interface UIStrings {
  appName: string;
  appTagline: string;
  selectLanguagePrompt: string;
  recordYourStory: string;
  recordInstruction: string;
  startRecording: string;
  stopRecording: string;
  pauseRecording: string;
  resumeRecording: string;
  listening: string;
  processingAudio: string;
  reRecord: string;
  playAudio: string;
  pauseAudio: string;
  submitToAgent: string;
  trySampleStories: string;
  useSampleStory: string;
  sampleAmharicTitle: string;
  sampleOromoTitle: string;
  sampleEnglishTitle: string;
  honestExtractionTitle: string;
  honestPrincipleBadge: string;
  honestPrincipleText: string;
  originalTranscript: string;
  transcriptDisclaimer: string;
  statusApplicantStated: string;
  statusMissing: string;
  statusSupported: string;
  statusContradiction: string;
  notMentionedYet: string;
  quoteSourceLabel: string;
  editField: string;
  saveField: string;
  cancel: string;
  addFieldVoice: string;
  fieldsStatedCount: string;
  fieldsMissingCount: string;
  honestScore: string;
  downloadApplication: string;
  copyApplicationJson: string;
  copied: string;
  extractionNotesTitle: string;
  spikeBenchTitle: string;
  spikeBenchSubtitle: string;
  viewSpike: string;
  backToRecorder: string;
  viewLanding: string;
  openVoiceApp: string;

  // Field Names
  field_business_name: string;
  field_business_type: string;
  field_business_start_date: string;
  field_location_description: string;
  field_num_employees: string;
  field_monthly_or_annual_sales: string;
  field_machinery_equipment: string;
  field_funding_purpose: string;
  field_funding_amount_requested: string;
  field_beneficiaries_impact: string;
}

export const translations: Record<Language, UIStrings> = {
  am: {
    appName: "ቬስፐር (Vesper.ai)",
    appTagline: "የድምጽ ወደ እውነተኛ የንግድ ብድር ማመልከቻ",
    selectLanguagePrompt: "እባክዎን የሚናገሩበትን ቋንቋ ይምረጡ",
    recordYourStory: "የንግድ ስራዎን ታሪክ በድምጽዎ ይንገሩን",
    recordInstruction: "ስለ ስራዎ አይነት፣ ስም፣ ሰራተኞች፣ ሽያጭ እና ለምን ብድር እንደሚፈልጉ በነጻነት ይናገሩ።",
    startRecording: "ድምጽ መቅዳት ጀምር",
    stopRecording: "ቀረጻ አቁም",
    pauseRecording: "ለጊዜው አቁም",
    resumeRecording: "ቀጥል",
    listening: "እያዳመጥን ነው...",
    processingAudio: "ድምጽዎን በመተርጎም እና መረጃውን በማረጋገጥ ላይ...",
    reRecord: "እንደገና ቅረፅ",
    playAudio: "አጫውት",
    pauseAudio: "አቁም",
    submitToAgent: "ታሪኬን ለብድር ወኪል አስገባ",
    trySampleStories: "ወይም የተዘጋጀ ናሙና ድምጽ ይሞክሩ",
    useSampleStory: "ይህን ናሙና ተጠቀም",
    sampleAmharicTitle: "የመርካቶ የጨርቃጨርቅ ሱቅ (አማርኛ)",
    sampleOromoTitle: "የጅማ የቡና ማቀነባበሪያ (ኦሮምኛ)",
    sampleEnglishTitle: "የብረት ስራ እና ማምረቻ (እንግሊዝኛ)",
    honestExtractionTitle: "የተረጋገጠ የማመልከቻ ውጤት",
    honestPrincipleBadge: "የማይዋሽ መርህ (Honest Extraction)",
    honestPrincipleText: "እኛ አንገምትም። እያንዳንዱ መረጃ ከመናገርዎ የተወሰደ ወይም ያልተጠቀሰ ተብሎ በግልጽ ምልክት ይደረግበታል።",
    originalTranscript: "የተነገረው ቃል በቃል (Original Transcript)",
    transcriptDisclaimer: "ይህ በድምጽዎ የተናገሩት ትክክለኛ የጽሁፍ ግልባጭ ነው።",
    statusApplicantStated: "በአመልካቹ የተገለጸ",
    statusMissing: "አልተጠቀሰም",
    statusSupported: "በሰነድ የተረጋገጠ",
    statusContradiction: "ተቃርኖ ያለው",
    notMentionedYet: "በታሪኩ ውስጥ አልተጠቀሰም",
    quoteSourceLabel: "የተወሰደበት ቃል፡",
    editField: "አስተካክል",
    saveField: "አስቀምጥ",
    cancel: "ሰርዝ",
    addFieldVoice: "በድምጽ ጨምር",
    fieldsStatedCount: "የተገለጹ መረጃዎች",
    fieldsMissingCount: "ያልተጠቀሱ መረጃዎች",
    honestScore: "የግልጽነት ደረጃ",
    downloadApplication: "ማመልከቻውን አውርድ",
    copyApplicationJson: "JSON ኮፒ አድርግ",
    copied: "ተቀድቷል!",
    extractionNotesTitle: "የወኪሉ ማስታወሻዎች እና ትንታኔ",
    spikeBenchTitle: "የአማርኛ እና ኦሮምኛ ጥራት ግምገማ (Spike)",
    spikeBenchSubtitle: "የቋንቋ ትክክለኛነት እና የድምጽ ትንተና ጥናት ውጤት",
    viewSpike: "የቋንቋ ጥናት መረጃ (Spike)",
    backToRecorder: "ወደ ቀረጻ ተመለስ",
    viewLanding: "የመግቢያ ገጽ",
    openVoiceApp: "የድምጽ ማመልከቻ ጀምር",

    field_business_name: "የንግዱ / ድርጅቱ ስም",
    field_business_type: "የስራው ዘርፍና አይነት",
    field_business_start_date: "ስራው የተጀመረበት ጊዜ",
    field_location_description: "የስራው ቦታ / አድራሻ",
    field_num_employees: "የሰራተኞች ብዛት",
    field_monthly_or_annual_sales: "የወር ወይም የዓመት ገቢ",
    field_machinery_equipment: "ማሽኖች እና ቁሳቁሶች",
    field_funding_purpose: "የብድሩ ዋና ዓላማ",
    field_funding_amount_requested: "የሚጠየቀው የብድር መጠን",
    field_beneficiaries_impact: "የስራ እድል እና ተጠቃሚዎች",
  },
  om: {
    appName: "Vesper.ai",
    appTagline: "Sagaleedhaan Iyyannoo Liqii Dhugaa Qopheessaa",
    selectLanguagePrompt: "Afaan ittiin dubbattu filadhaa",
    recordYourStory: "Seenaa daldala keessanii sagaleedhaan nutti himaa",
    recordInstruction: "Waa'ee maqaa daldalaa, hojjettoota, galii fi maaliif liqii akka barbaaddan bilisaan dubbadhaa.",
    startRecording: "Waraabuu Eegali",
    stopRecording: "Waraabuu Dhaabi",
    pauseRecording: "Xiqqoo Dhaabi",
    resumeRecording: "Itti Fufi",
    listening: "Dhaggeeffachaa jirra...",
    processingAudio: "Sagalee keessan qorachaa jirra...",
    reRecord: "Irra Deebi'ii Waraabi",
    playAudio: "Taphaachiisi",
    pauseAudio: "Dhaabi",
    submitToAgent: "Iyyannoo Dhiyeessi",
    trySampleStories: "Yookiin fakkeenya sagalee qophaa'e fayyadamaa",
    useSampleStory: "Fakkeenya kana fayyadami",
    sampleAmharicTitle: "Suuqii Huccuu Markaatoo (Amharic)",
    sampleOromoTitle: "Qophii Bunnaa Jimmaa (Afaan Oromoo)",
    sampleEnglishTitle: "Hojii Sibilaa Finfinnee (English)",
    honestExtractionTitle: "Bu'aa Iyyannoo Dhugaa",
    honestPrincipleBadge: "Qajeelfama Dhugaa (Honest Extraction)",
    honestPrincipleText: "Nuyi hin tilmaamnu. Qabxiin hundi wanta dubbatame ykn kan hin ibsamne ta'uun isaa ifatti mul'ata.",
    originalTranscript: "Wanta Dubbatame (Original Transcript)",
    transcriptDisclaimer: "Kun jechoota keessan isa sirrii gara barruutti jijjiirameedha.",
    statusApplicantStated: "Iyyataan Kan Dubbatame",
    statusMissing: "Hin Dubbatamne",
    statusSupported: "Ragaadhaan Kan Mirkanaa'e",
    statusContradiction: "Walfaallessa",
    notMentionedYet: "Seenaa keessatti hin dubbatamne",
    quoteSourceLabel: "Jechooota dubbataman:",
    editField: "Gulaali",
    saveField: "Olkaawi",
    cancel: "Haqi",
    addFieldVoice: "Sagaleedhaan Dabalata",
    fieldsStatedCount: "Qabxiilee Dubbataman",
    fieldsMissingCount: "Qabxiilee Hin Dubbatamne",
    honestScore: "Sadarkaa Dhugummaa",
    downloadApplication: "Iyyannoo Buufadhu",
    copyApplicationJson: "JSON Koppi Godhi",
    copied: "Koppi Ta'eera!",
    extractionNotesTitle: "Yaada fi Qorannoo Eejentii",
    spikeBenchTitle: "Qorannoo Qulqullina Afaan Oromoo fi Amaaraa",
    spikeBenchSubtitle: "Bu'aa qorannoo sirrummaa sagalee fi barruu",
    viewSpike: "Qorannoo Afaanii (Spike)",
    backToRecorder: "Gara Waraabuutti Deebi'i",
    viewLanding: "Fuula Jalqabaa",
    openVoiceApp: "Iyyannoo Sagalee Eegali",

    field_business_name: "Maqaa Daldalaa / Dhaabbataa",
    field_business_type: "Gosa fi Damee Hojii",
    field_business_start_date: "Bara Hojiin Eegale",
    field_location_description: "Bakka fi Teessoo Daldalaa",
    field_num_employees: "Baay'ina Hojjettootaa",
    field_monthly_or_annual_sales: "Galii Ji'aa ykn Waggaa",
    field_machinery_equipment: "Meeshaalee fi Maashinoota",
    field_funding_purpose: "Kaayyoo Liqii Barbaadamu",
    field_funding_amount_requested: "Hamma Liqii Barbaadame",
    field_beneficiaries_impact: "Carraa Hojii fi Faayidaa Hawaasaa",
  },
  en: {
    appName: "Vesper.ai",
    appTagline: "Voice-to-Honest Funding Application",
    selectLanguagePrompt: "Select your preferred spoken language",
    recordYourStory: "Tell your business story out loud",
    recordInstruction: "Speak freely about your business type, employees, sales, machinery, and why you need funding.",
    startRecording: "Start Recording",
    stopRecording: "Stop Recording",
    pauseRecording: "Pause",
    resumeRecording: "Resume",
    listening: "Listening carefully...",
    processingAudio: "Transcribing audio and auditing field claims...",
    reRecord: "Re-record Story",
    playAudio: "Play Audio",
    pauseAudio: "Pause",
    submitToAgent: "Submit to Honest AI Agent",
    trySampleStories: "Or test with pre-recorded business story samples",
    useSampleStory: "Load this Sample",
    sampleAmharicTitle: "Merkato Textile Retail Shop (Amharic)",
    sampleOromoTitle: "Jimma Coffee Processing Station (Oromo)",
    sampleEnglishTitle: "Addis Metal Fabrication Workshop (English)",
    honestExtractionTitle: "Honest Application Extraction",
    honestPrincipleBadge: "Core Principle: We Don't Guess",
    honestPrincipleText: "Every field is bound to an exact spoken quote and marked as 'Applicant Stated' or explicitly 'Missing'.",
    originalTranscript: "Verbatim Spoken Transcript",
    transcriptDisclaimer: "Unfiltered speech-to-text transcript capturing the applicant's spoken narrative.",
    statusApplicantStated: "Applicant Stated",
    statusMissing: "Missing / Not Mentioned",
    statusSupported: "Document Supported",
    statusContradiction: "Contradiction",
    notMentionedYet: "Not mentioned yet in story",
    quoteSourceLabel: "Verbatim Quote Source:",
    editField: "Edit",
    saveField: "Save Changes",
    cancel: "Cancel",
    addFieldVoice: "Add via Voice",
    fieldsStatedCount: "Fields Stated",
    fieldsMissingCount: "Fields Missing",
    honestScore: "Honesty & Clarity Score",
    downloadApplication: "Download Application Pack",
    copyApplicationJson: "Copy JSON Schema",
    copied: "Copied to Clipboard!",
    extractionNotesTitle: "Extraction Notes & Ambiguity Audit",
    spikeBenchTitle: "Section 4: Amharic & Oromo Spike Benchmark",
    spikeBenchSubtitle: "Speech transcription accuracy, phonetic resilience, and decision gate metrics",
    viewSpike: "View Language Spike Report",
    backToRecorder: "Back to Recorder",
    viewLanding: "Landing Page",
    openVoiceApp: "Start Voice Intake",

    field_business_name: "Business Name",
    field_business_type: "Business Type / Sector",
    field_business_start_date: "Start Date / Operating Since",
    field_location_description: "Location & Premises",
    field_num_employees: "Number of Employees",
    field_monthly_or_annual_sales: "Monthly / Annual Revenue",
    field_machinery_equipment: "Machinery & Equipment",
    field_funding_purpose: "Purpose of Funding",
    field_funding_amount_requested: "Requested Funding Amount",
    field_beneficiaries_impact: "Beneficiaries & Job Impact",
  },
};
