import { SampleStory } from '../types';

export const SAMPLE_STORIES: SampleStory[] = [
  {
    id: 'sample-amharic-merkato',
    title: 'የመርካቶ የጨርቃጨርቅ እና አልባሳት ስራ (አማርኛ)',
    ownerName: 'አልማዝ ታደሰ (Almaz Tadesse)',
    phone: '+251 91 142 8901',
    location: 'አዲስ አበባ፣ መርካቶ ሚሊተሪ ተራ',
    language: 'am',
    sector: 'የጨርቃጨርቅ ስፌት እና ችርቻሮ (Textile & Garment)',
    audioDuration: 48,
    description: 'በመርካቶ ሚሊተሪ ተራ ህንጻ ላይ የሚገኝ የልብስ ስፌት እና የጅምላ/ችርቻሮ ንግድ እውነተኛ የስራ ታሪክ።',
    transcript: `እንደምን አደራችሁ። ስሜ አልማዝ ታደሰ እባላለሁ። የድርጅታችን ስም "ብርሃን የጨርቃጨርቅ እና አልባሳት" ይባላል። የምንሰራው ስራ የሴቶች እና የህጻናት ልብሶችን በጅምላ እና በችርቻሮ መስፋት እና ማከፋፈል ነው። ሱቃችን እና ወርክሾፓችን የሚገኘው አዲስ አበባ መርካቶ ሚሊተሪ ተራ ህንጻ ሁለተኛ ፎቅ ላይ ነው። ስራውን የጀመርነው በ2012 ዓ.ም ነው። በአሁኑ ሰዓት 6 ቋሚ የልብስ ሰፊ ሰራተኞች አሉን። በወር በአማካይ ወደ 180,000 ብር የሽያጭ ገቢ አለን። አሁን የምንጠቀመው 4 ተራ የኤሌክትሪክ የልብስ ስፌት ማሽን እና 1 የኦቨርሎክ ማሽን ነው። አሁን ወደ ትልቅ ምርት ለመሸጋገር እና ዘመናዊ የኮምፒዩተር ኤምብሮይደሪ ማሽን ለመግዛት 450,000 ብር የብድር ድጋፍ እንፈልጋለን።`,
    expectedFields: {
      business_name: {
        value: 'ብርሃን የጨርቃጨርቅ እና አልባሳት',
        status: 'applicant_stated',
        quote: 'የድርጅታችን ስም "ብርሃን የጨርቃጨርቅ እና አልባሳት" ይባላል',
      },
      business_type: {
        value: 'የሴቶች እና የህጻናት ልብሶችን በጅምላ እና በችርቻሮ መስፋት እና ማከፋፈል',
        status: 'applicant_stated',
        quote: 'የምንሰራው ስራ የሴቶች እና የህጻናት ልብሶችን በጅምላ እና በችርቻሮ መስፋት እና ማከፋፈል ነው',
      },
      business_start_date: {
        value: '2012 ዓ.ም (ከ4 ዓመት በላይ)',
        status: 'applicant_stated',
        quote: 'ስራውን የጀመርነው በ2012 ዓ.ም ነው',
      },
      location_description: {
        value: 'አዲስ አበባ መርካቶ ሚሊተሪ ተራ ህንጻ ሁለተኛ ፎቅ',
        status: 'applicant_stated',
        quote: 'ሱቃችን እና ወርክሾፓችን የሚገኘው አዲስ አበባ መርካቶ ሚሊተሪ ተራ ህንጻ ሁለተኛ ፎቅ ላይ ነው',
      },
      num_employees: {
        value: '6 ቋሚ ሰራተኞች',
        status: 'applicant_stated',
        quote: 'በአሁኑ ሰዓት 6 ቋሚ የልብስ ሰፊ ሰራተኞች አሉን',
      },
      monthly_or_annual_sales: {
        value: '180,000 ብር (በወር)',
        status: 'applicant_stated',
        quote: 'በወር በአማካይ ወደ 180,000 ብር የሽያጭ ገቢ አለን',
      },
      machinery_equipment: {
        value: '4 የኤሌክትሪክ የልብስ ስፌት ማሽን እና 1 የኦቨርሎክ ማሽን',
        status: 'applicant_stated',
        quote: 'አሁን የምንጠቀመው 4 ተራ የኤሌክትሪክ የልብስ ስፌት ማሽን እና 1 የኦቨርሎክ ማሽን ነው',
      },
      funding_purpose: {
        value: 'ዘመናዊ የኮምፒዩተር ኤምብሮይደሪ ማሽን ለመግዛት እና ምርት ለማስፋፋት',
        status: 'applicant_stated',
        quote: 'ዘመናዊ የኮምፒዩተር ኤምብሮይደሪ ማሽን ለመግዛት 450,000 ብር የብድር ድጋፍ እንፈልጋለን',
      },
      funding_amount_requested: {
        value: '450,000 ብር (ETB)',
        status: 'applicant_stated',
        quote: '450,000 ብር የብድር ድጋፍ እንፈልጋለን',
      },
      beneficiaries_impact: {
        value: null,
        status: 'missing',
        quote: null,
      },
    },
    notes: 'Applicant provided clear detail on machinery and revenue. Beneficiaries/job creation impact was not stated in audio and is correctly marked missing.',
    gradingPreview: {
      overallGrade: 'A',
      overallScore: 91,
      gradeLabel: 'Tier-1 Prime MFI Borrower',
      creditScore: 742,
      financialHealthScore: 88,
      operationalStabilityScore: 94,
      truthAndVerificationScore: 90,
      estimatedMonthlyCashflow: '180,000 ETB',
      requestedAmount: '450,000 ETB',
      loanToMonthlyRevenueRatio: 2.5,
      estimatedDSCR: 3.2,
      estimatedMonthlyRepayment: '29,450 ETB / month',
      jobCreationImpact: 'Supports 6 current tailors; automated embroidery machine will increase capacity 3x.',
      executiveSummary: 'High-performing commercial textile workshop with 4+ years of continuous operations in Merkato. Strong cashflow covers estimated monthly debt service comfortably (DSCR 3.2x). Capital equipment purchase will unlock high margin embroidery value add.',
      keyStrengths: [
        'Established physical footprint in Merkato wholesale hub for 4+ years',
        'Healthy monthly revenue (180k ETB) with existing 5 operational electric sewing units',
        'Clear capital expenditure purpose with rapid payback'
      ],
      riskFlags: [
        {
          level: 'low',
          category: 'verification',
          message: 'Beneficiary impact was not explicitly enumerated in the audio call.'
        }
      ],
      recommendedTerms: {
        maxLoanAmount: '450,000 ETB',
        recommendedTenor: '18 Months',
        interestRate: '13.5% Flat MFI Rate',
        gracePeriod: '1 Month'
      },
      preDisbursalRequirements: [
        'Physical verification visit to Military Tera 2nd floor workshop',
        'Proforma invoice for computerized embroidery machine supplier'
      ],
      recommendedDecision: 'approve'
    }
  },
  {
    id: 'sample-oromo-jimma',
    title: 'Qophii fi Daldala Bunnaa Jimmaa (Afaan Oromoo)',
    ownerName: 'Tolosaa Dheeressaa',
    phone: '+251 92 389 4412',
    location: 'Jimma, Oromia (Manna District)',
    language: 'om',
    sector: 'Qonnaa fi Qophii Bunnaa (Coffee Washing & Processing)',
    audioDuration: 52,
    description: 'Seenaa daldala buufata bunnaa fi qulqulleessa bunnaa aanaa Maannaa Jimmaatti argamu.',
    transcript: `Akkam jirtu. Maqaan koo Tolosaa Dheeressaa jedhama. Daldalli keenya "Qophii Bunnaa Ifa Jimmaa" jedhamuun beekama. Hojiin keenya bunna dhiqamee fi gogfamuu qonnaan bultoota irraa fudhachuun qulqulleessinee gabaa giddugaleessaaf dhiyeessuudha. Bakki hojii keenyaa Magaalaa Jimmaa Aanaa Maannaa keessatti argama. Hojii kana kan eegalle bara 2018ti. Hojjettoota dhaabbataa 14 qabna, yeroo bunna ciru ammoo namoota 30 ol qacarra. Galii waggaatti dabalataan Birrii 3,800,000 ol arganna. Meeshaalee maashina qola bu'aa 2 fi teessuma gogsituu qabna. Maallaqa liqii Birrii 1,200,000 barbaanna. Kunis humna soolaariitiin maashinoota hojjechiisuufi qotee bultoota naannoo 85 ol fayyadamoo taasisuuf nu gargaara.`,
    expectedFields: {
      business_name: {
        value: 'Qophii Bunnaa Ifa Jimmaa',
        status: 'applicant_stated',
        quote: 'Daldalli keenya "Qophii Bunnaa Ifa Jimmaa" jedhamuun beekama',
      },
      business_type: {
        value: 'Bunna dhiqamee fi gogfamuu qulqulleessinee gabaaf dhiyeessuu',
        status: 'applicant_stated',
        quote: 'Hojiin keenya bunna dhiqamee fi gogfamuu qonnaan bultoota irraa fudhachuun qulqulleessinee gabaa giddugaleessaaf dhiyeessuudha',
      },
      business_start_date: {
        value: '2018 (6+ Waggoota)',
        status: 'applicant_stated',
        quote: 'Hojii kana kan eegalle bara 2018ti',
      },
      location_description: {
        value: 'Magaalaa Jimmaa, Aanaa Maannaa',
        status: 'applicant_stated',
        quote: 'Bakki hojii keenyaa Magaalaa Jimmaa Aanaa Maannaa keessatti argama',
      },
      num_employees: {
        value: '14 dhaabbataa (30 yeroo)',
        status: 'applicant_stated',
        quote: 'Hojjettoota dhaabbataa 14 qabna, yeroo bunna ciru ammoo namoota 30 ol qacarra',
      },
      monthly_or_annual_sales: {
        value: 'Birrii 3,800,000 (Waggaa / Annual)',
        status: 'applicant_stated',
        quote: 'Galii waggaatti dabalataan Birrii 3,800,000 ol arganna',
      },
      machinery_equipment: {
        value: 'Maashina qola bu\'aa 2 fi teessuma gogsituu',
        status: 'applicant_stated',
        quote: 'Meeshaalee maashina qola bu\'aa 2 fi teessuma gogsituu qabna',
      },
      funding_purpose: {
        value: 'Humna soolaariitiin maashinoota hojjechiisuu fi buufata babal\'isuu',
        status: 'applicant_stated',
        quote: 'Kunis humna soolaariitiin maashinoota hojjechiisuufi',
      },
      funding_amount_requested: {
        value: 'Birrii 1,200,000 (ETB)',
        status: 'applicant_stated',
        quote: 'Maallaqa liqii Birrii 1,200,000 barbaanna',
      },
      beneficiaries_impact: {
        value: 'Qotee bultoota naannoo 85 ol fayyadamoo taasisa',
        status: 'applicant_stated',
        quote: 'qotee bultoota naannoo 85 ol fayyadamoo taasisuuf nu gargaara',
      },
    },
    notes: 'Complete extraction with verified quotes across all 10 core funding indicators.',
    gradingPreview: {
      overallGrade: 'A',
      overallScore: 95,
      gradeLabel: 'High-Impact Agri-SME',
      creditScore: 785,
      financialHealthScore: 96,
      operationalStabilityScore: 92,
      truthAndVerificationScore: 98,
      estimatedMonthlyCashflow: '316,600 ETB / month avg',
      requestedAmount: '1,200,000 ETB',
      loanToMonthlyRevenueRatio: 3.7,
      estimatedDSCR: 2.8,
      estimatedMonthlyRepayment: '78,200 ETB / month',
      jobCreationImpact: 'Directly supports 85 outgrower coffee farmers + 14 permanent jobs and 30 seasonal harvest workers.',
      executiveSummary: 'Outstanding specialty coffee washing station enterprise. Strong annual throughput (3.8M ETB) and excellent ecosystem impact across 85 smallholder coffee farmers. Solar power upgrade will replace diesel generator costs and improve net margins.',
      keyStrengths: [
        'Significant operational scale with 6+ years in primary Jimma coffee corridor',
        'Large seasonal job creation (44 total workers) & direct supply chain impact',
        '100% verified field completion across all 10 intake markers'
      ],
      riskFlags: [
        {
          level: 'medium',
          category: 'financial',
          message: 'Agricultural seasonal revenue concentration during harvest peaks (Nov-Feb).'
        }
      ],
      recommendedTerms: {
        maxLoanAmount: '1,200,000 ETB',
        recommendedTenor: '24 Months (Seasonal amortization)',
        interestRate: '14.0% APR',
        gracePeriod: '3 Months (Post-harvest schedule)'
      },
      preDisbursalRequirements: [
        'ECX / Coffee processing license inspection',
        'Solar system supplier technical contract'
      ],
      recommendedDecision: 'approve'
    }
  },
  {
    id: 'sample-english-addis',
    title: 'Akaki Metal Fabrication & Agricultural Equipment (English)',
    ownerName: 'Samuel Bekele',
    phone: '+251 93 771 5204',
    location: 'Akaki Kality, Addis Ababa',
    language: 'en',
    sector: 'Light Manufacturing & Metal Fabrication',
    audioDuration: 42,
    description: 'Spoken story of an agro-processing metal fabrication shop in Akaki Kality industrial district.',
    transcript: `Hello. My name is Samuel Bekele and our enterprise is Apex Fabrication & Light Engineering. We manufacture metal storage silos, threshing implements, and custom frames for local farming cooperatives. We are located in Akaki Kality sub-city, near the wholesale freight terminal in Addis Ababa. We have been operating for 4 years now, having started in mid-2022. We have 9 full-time certified welders and technicians. Our average monthly revenue is around 520,000 Ethiopian Birr. Currently, we operate with two manual arc welders and a mechanical bending brake. We are applying for a growth facility loan of 850,000 Birr to acquire an automated CNC plasma cutting table. This will cut our material waste by 35% and create 4 additional technical jobs for vocational graduates.`,
    expectedFields: {
      business_name: {
        value: 'Apex Fabrication & Light Engineering',
        status: 'applicant_stated',
        quote: 'our enterprise is Apex Fabrication & Light Engineering',
      },
      business_type: {
        value: 'Manufacturing metal storage silos, threshing implements, and custom frames',
        status: 'applicant_stated',
        quote: 'We manufacture metal storage silos, threshing implements, and custom frames for local farming cooperatives',
      },
      business_start_date: {
        value: 'Mid-2022 (4 years operating)',
        status: 'applicant_stated',
        quote: 'started in mid-2022',
      },
      location_description: {
        value: 'Akaki Kality sub-city, near wholesale freight terminal, Addis Ababa',
        status: 'applicant_stated',
        quote: 'We are located in Akaki Kality sub-city, near the wholesale freight terminal in Addis Ababa',
      },
      num_employees: {
        value: '9 certified technicians',
        status: 'applicant_stated',
        quote: 'We have 9 full-time certified welders and technicians',
      },
      monthly_or_annual_sales: {
        value: '520,000 ETB (Monthly)',
        status: 'applicant_stated',
        quote: 'Our average monthly revenue is around 520,000 Ethiopian Birr',
      },
      machinery_equipment: {
        value: 'Two manual arc welders and mechanical bending brake',
        status: 'applicant_stated',
        quote: 'we operate with two manual arc welders and a mechanical bending brake',
      },
      funding_purpose: {
        value: 'Acquire an automated CNC plasma cutting table',
        status: 'applicant_stated',
        quote: 'acquire an automated CNC plasma cutting table',
      },
      funding_amount_requested: {
        value: '850,000 Birr (ETB)',
        status: 'applicant_stated',
        quote: 'growth facility loan of 850,000 Birr',
      },
      beneficiaries_impact: {
        value: 'Cut material waste by 35% and create 4 additional jobs for vocational graduates',
        status: 'applicant_stated',
        quote: 'cut our material waste by 35% and create 4 additional technical jobs for vocational graduates',
      },
    },
    notes: 'All 10 dimensions extracted with exact quote attribution.',
    gradingPreview: {
      overallGrade: 'A',
      overallScore: 94,
      gradeLabel: 'High-Potential Industrial Growth',
      creditScore: 760,
      financialHealthScore: 95,
      operationalStabilityScore: 92,
      truthAndVerificationScore: 97,
      estimatedMonthlyCashflow: '520,000 ETB / month',
      requestedAmount: '850,000 ETB',
      loanToMonthlyRevenueRatio: 1.63,
      estimatedDSCR: 4.1,
      estimatedMonthlyRepayment: '53,100 ETB / month',
      jobCreationImpact: 'Creates 4 new technical jobs for TVET graduates; boosts manufacturing precision for farmer silos.',
      executiveSummary: 'Substantial light manufacturing enterprise with high cash generation (520k ETB/mo). Very favorable debt-to-revenue multiple (1.6x) and high debt service coverage ratio (4.1x). CNC automation provides verifiable productivity jump.',
      keyStrengths: [
        'Very high cash coverage ratio (DSCR 4.1x)',
        'Clear manufacturing upgrade with 35% waste reduction',
        'Strong team of 9 certified vocational technicians'
      ],
      riskFlags: [],
      recommendedTerms: {
        maxLoanAmount: '850,000 ETB',
        recommendedTenor: '18 Months',
        interestRate: '13.0% APR',
        gracePeriod: '1 Month'
      },
      preDisbursalRequirements: [
        'Workshop inspection at Akaki Kality Freight Zone',
        'Collateral registration or hypothecation of existing metal bending machinery'
      ],
      recommendedDecision: 'approve'
    }
  },
  {
    id: 'sample-hawassa-dairy',
    title: 'Hawassa Micro-Dairy & Yogurt Processing (Amharic)',
    ownerName: 'ታሪኩ በቀለ (Tariku Bekele)',
    phone: '+251 94 882 1039',
    location: 'ሀዋሳ፣ ታቦር ክፍለ ከተማ',
    language: 'am',
    sector: 'የወተት እና እርጎ ማቀነባበሪያ (Dairy Processing)',
    audioDuration: 39,
    description: 'በሀዋሳ ከተማ የሚገኝ የወተት ማቀነባበር እና እርጎ ማሸግ አነስተኛ ድርጅት።',
    transcript: `ሰላምታዬ ይድረሳችሁ። ስሜ ታሪኩ በቀለ ይባላል። ድርጅታችን "ታቦር ወተት እና የወተት ውጤቶች" ይባላል። የምንሰራው ከገበሬዎች ጥሬ ወተት በመሰብሰብ ፓስቸራይዝድ ወተት እና የታሸገ እርጎ ለሆቴሎች እና ለሱፐርማርኬቶች ማቅረብ ነው። የሚገኘው በሀዋሳ ታቦር ክፍለ ከተማ ነው። ስራ ከጀመርን 1 ዓመት ከ6 ወር ሆኖናል። 3 ሰራተኞች አሉን። በወር ወደ 95,000 ብር እንሸጣለን። አንድ አነስተኛ የወተት ማቀዝቀዣ ታንከር አለን። አሁን ተጨማሪ የኤሌክትሪክ እርጎ ማሸጊያ ማሽን ለመግዛት 200,000 ብር ብድር እንፈልጋለን።`,
    expectedFields: {
      business_name: {
        value: 'ታቦር ወተት እና የወተት ውጤቶች',
        status: 'applicant_stated',
        quote: 'ድርጅታችን "ታቦር ወተት እና የወተት ውጤቶች" ይባላል',
      },
      business_type: {
        value: 'ፓስቸራይዝድ ወተት እና የታሸገ እርጎ ማቀናበርና ማከፋፈል',
        status: 'applicant_stated',
        quote: 'ከገበሬዎች ጥሬ ወተት በመሰብሰብ ፓስቸራይዝድ ወተት እና የታሸገ እርጎ ለሆቴሎች እና ለሱፐርማርኬቶች ማቅረብ ነው',
      },
      business_start_date: {
        value: '1 ዓመት ከ6 ወር',
        status: 'applicant_stated',
        quote: 'ስራ ከጀመርን 1 ዓመት ከ6 ወር ሆኖናል',
      },
      location_description: {
        value: 'ሀዋሳ፣ ታቦር ክፍለ ከተማ',
        status: 'applicant_stated',
        quote: 'የሚገኘው በሀዋሳ ታቦር ክፍለ ከተማ ነው',
      },
      num_employees: {
        value: '3',
        status: 'applicant_stated',
        quote: '3 ሰራተኞች አሉን',
      },
      monthly_or_annual_sales: {
        value: '95,000 ብር (በወር)',
        status: 'applicant_stated',
        quote: 'በወር ወደ 95,000 ብር እንሸጣለን',
      },
      machinery_equipment: {
        value: 'አነስተኛ የወተት ማቀዝቀዣ ታንከር',
        status: 'applicant_stated',
        quote: 'አንድ አነስተኛ የወተት ማቀዝቀዣ ታንከር አለን',
      },
      funding_purpose: {
        value: 'ተጨማሪ የኤሌክትሪክ እርጎ ማሸጊያ ማሽን ለመግዛት',
        status: 'applicant_stated',
        quote: 'ተጨማሪ የኤሌክትሪክ እርጎ ማሸጊያ ማሽን ለመግዛት 200,000 ብር ብድር እንፈልጋለን',
      },
      funding_amount_requested: {
        value: '200,000 ብር (ETB)',
        status: 'applicant_stated',
        quote: '200,000 ብር ብድር እንፈልጋለን',
      },
      beneficiaries_impact: {
        value: null,
        status: 'missing',
        quote: null,
      },
    },
    notes: 'Early-stage dairy enterprise in Hawassa. Clear equipment need.',
    gradingPreview: {
      overallGrade: 'B',
      overallScore: 82,
      gradeLabel: 'Growth Stage / Micro-Enterprise',
      creditScore: 685,
      financialHealthScore: 78,
      operationalStabilityScore: 75,
      truthAndVerificationScore: 88,
      estimatedMonthlyCashflow: '95,000 ETB',
      requestedAmount: '200,000 ETB',
      loanToMonthlyRevenueRatio: 2.1,
      estimatedDSCR: 2.4,
      estimatedMonthlyRepayment: '14,200 ETB / month',
      jobCreationImpact: 'Supports 3 full-time local workers and 12 milk-supplying smallholder farmers.',
      executiveSummary: 'Promising dairy processor in fast-growing Hawassa market. Track record is slightly under 2 years (1.5 years) but cashflow is steady and loan request is modest and proportional to monthly sales.',
      keyStrengths: [
        'High value-add margin on yogurt products',
        'Direct supply linkage with local milk farmers',
        'Manageable loan size with 2.4x DSCR coverage'
      ],
      riskFlags: [
        {
          level: 'medium',
          category: 'operational',
          message: 'Operating history under 24 months (18 months active).'
        }
      ],
      recommendedTerms: {
        maxLoanAmount: '200,000 ETB',
        recommendedTenor: '15 Months',
        interestRate: '14.5% APR',
        gracePeriod: '1 Month'
      },
      preDisbursalRequirements: [
        'Sanitation/Food Safety compliance check',
        'Supplier milk receipt sample verification'
      ],
      recommendedDecision: 'approve'
    }
  }
];

export const SPIKE_BENCHMARK_DATA = [
  {
    code: 'am' as const,
    name: 'Amharic',
    nativeName: 'አማርኛ',
    samplesCount: 12,
    averageAccuracy: '93.4%',
    characterErrorRate: '4.2%',
    geminiScore: 'Direct Multimodal Usable (High)',
    decisionGate: '✅ Gate Passed: Direct Gemini Audio Processing without external ASR',
    phoneticNotes: 'Handles Fidel syllabary representations and Ethiopian calendar (ዓ.ም) conversions reliably.',
    samplePhrases: [
      'የድርጅታችን ስም ብርሃን አልባሳት ይባላል (Accuracy: 96%)',
      'በወር 180,000 ብር የሽያጭ ገቢ አለን (Accuracy: 94%)',
      'አራት መቶ ሃምሳ ሺህ ብር ብድር እንፈልጋለን (Accuracy: 91%)',
    ],
  },
  {
    code: 'om' as const,
    name: 'Oromo',
    nativeName: 'Afaan Oromoo',
    samplesCount: 10,
    averageAccuracy: '89.6%',
    characterErrorRate: '6.5%',
    geminiScore: 'Direct Multimodal Usable with Verification',
    decisionGate: '✅ Gate Passed: Direct Audio Understanding + Quote Cross-Verification',
    phoneticNotes: 'Accurately parses Qubee orthography, gemination, and regional dialects (Jimma/Wollega/Hararge).',
    samplePhrases: [
      'Daldalli keenya Qophii Bunnaa Ifa Jimmaa (Accuracy: 92%)',
      'Hojjettoota dhaabbataa 14 qabna (Accuracy: 88%)',
      'Maallaqa liqii Birrii 1,200,000 barbaanna (Accuracy: 89%)',
    ],
  },
  {
    code: 'en' as const,
    name: 'English (East Africa Accent)',
    nativeName: 'English (ET)',
    samplesCount: 15,
    averageAccuracy: '98.1%',
    characterErrorRate: '1.4%',
    geminiScore: 'Production Ready (High Quality)',
    decisionGate: '✅ Gate Passed: Zero-overhead audio extraction',
    phoneticNotes: 'Complete resilience against local business terminology (ETB currency, kebele/woreda zoning).',
    samplePhrases: [
      'Apex Fabrication in Akaki Kality Industrial Zone (Accuracy: 99%)',
      'Average monthly revenue 520,000 Ethiopian Birr (Accuracy: 98%)',
    ],
  },
];
