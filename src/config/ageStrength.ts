export type AgeCategory = 'JUNIOREN' | 'JUNIORINNEN' | 'HERREN' | 'DAMEN' | 'FREIZEITLIGA'

export type JuniorenAge = 'U6'|'U7'|'U8'|'U9'|'U10'|'U11'|'U12'|'U13'|'U14'|'U15'|'U16'|'U17'|'U18'|'U19'
export type JuniorinnenAge = 'U6'|'U7'|'U8'|'U9'|'U10'|'U11'|'U12'|'U13'|'U14'|'U15'|'U16'|'U17'|'U18'|'U19'
export type HerrenAge = 'HERREN' | 'UE32' | 'UE40' | 'UE50' | 'UE60'
export type DamenAge = 'DAMEN'
export type FreizeitAge = 'FREIZEITLIGA'
export type SubAge = JuniorenAge | JuniorinnenAge | HerrenAge | DamenAge | FreizeitAge

export type Strength =
  | 'SEHR_SCHWACH' | 'SCHWACH' | 'NORMAL' | 'STARK' | 'SEHR_STARK'
  | 'GRUPPE' | 'C_KLASSE' | 'B_KLASSE' | 'A_KLASSE' | 'KREISKLASSE' | 'KREISLIGA' 
  | 'BEZIRKSLIGA' | 'BEZIRKSOBERLIGA' | 'LANDESLIGA' | 'FOERDERLIGA' | 'NLZ_LIGA'
  | 'BAYERNLIGA' | 'REGIONALLIGA' | 'DRITTE_LIGA' | 'ZWEITE_BUNDESLIGA' | 'ERSTE_BUNDESLIGA'

export const AGE_CATEGORY_LABEL: Record<AgeCategory, string> = {
  JUNIOREN: 'Junioren',
  JUNIORINNEN: 'Juniorinnen',
  HERREN: 'Herren',
  DAMEN: 'Damen',
  FREIZEITLIGA: 'Freizeitliga',
}

export const JUNIOREN_AGES: JuniorenAge[] = ['U6','U7','U8','U9','U10','U11','U12','U13','U14','U15','U16','U17','U18','U19']
export const JUNIORINNEN_AGES: JuniorinnenAge[] = ['U6','U7','U8','U9','U10','U11','U12','U13','U14','U15','U16','U17','U18','U19']
export const HERREN_AGES: HerrenAge[] = ['HERREN', 'UE32', 'UE40', 'UE50', 'UE60']
export const DAMEN_AGES: DamenAge[] = ['DAMEN']
export const FREIZEIT_AGES: FreizeitAge[] = ['FREIZEITLIGA']

export const SUB_AGE_LABEL: Record<string, string> = {
  HERREN: 'Herren',
  UE32: 'Ü32',
  UE40: 'Ü40',
  UE50: 'Ü50',
  UE60: 'Ü60',
  DAMEN: 'Damen',
  FREIZEITLIGA: 'Freizeitliga',
}

export const STRENGTH_LABEL: Record<Strength, string> = {
  SEHR_SCHWACH: 'sehr schwach',
  SCHWACH: 'schwach',
  NORMAL: 'normal',
  STARK: 'stark',
  SEHR_STARK: 'sehr stark',
  GRUPPE: 'Gruppe',
  C_KLASSE: 'C-Klasse',
  B_KLASSE: 'B-Klasse',
  A_KLASSE: 'A-Klasse',
  KREISKLASSE: 'Kreisklasse',
  KREISLIGA: 'Kreisliga',
  BEZIRKSLIGA: 'Bezirksliga',
  BEZIRKSOBERLIGA: 'Bezirksoberliga',
  LANDESLIGA: 'Landesliga',
  FOERDERLIGA: 'Förderliga',
  NLZ_LIGA: 'NLZ',
  BAYERNLIGA: 'Bayernliga',
  REGIONALLIGA: 'Regionalliga',
  DRITTE_LIGA: '3. Liga',
  ZWEITE_BUNDESLIGA: '2. Bundesliga',
  ERSTE_BUNDESLIGA: '1. Bundesliga',
}

const BASIC_STRENGTH: Strength[] = ['SEHR_SCHWACH', 'SCHWACH', 'NORMAL', 'STARK', 'SEHR_STARK']

const JUNIOREN_U6_U11: Strength[] = BASIC_STRENGTH

const JUNIOREN_U12_U13: Strength[] = [
  'GRUPPE', 'KREISKLASSE', 'KREISLIGA', 'BEZIRKSOBERLIGA', 'FOERDERLIGA', 'NLZ_LIGA'
]

const JUNIOREN_U14_U15: Strength[] = [
  'GRUPPE', 'KREISKLASSE', 'KREISLIGA', 'BEZIRKSOBERLIGA', 'FOERDERLIGA', 'BAYERNLIGA', 'REGIONALLIGA', 'NLZ_LIGA'
]

const JUNIOREN_U16_U19: Strength[] = [
  'GRUPPE', 'KREISKLASSE', 'KREISLIGA', 'BEZIRKSOBERLIGA', 'FOERDERLIGA', 
  'LANDESLIGA', 'BAYERNLIGA', 'REGIONALLIGA', 
  'DRITTE_LIGA', 'ZWEITE_BUNDESLIGA', 'ERSTE_BUNDESLIGA'
]

const JUNIORINNEN_U6_U11: Strength[] = BASIC_STRENGTH

const JUNIORINNEN_U12_U15: Strength[] = [
  'GRUPPE', 'KREISLIGA', 'BEZIRKSLIGA'
]

const JUNIORINNEN_U16_U19: Strength[] = [
  'GRUPPE', 'BEZIRKSLIGA', 'BEZIRKSOBERLIGA', 'LANDESLIGA', 'BAYERNLIGA'
]

const HERREN_STRENGTH: Strength[] = [
  'C_KLASSE', 'B_KLASSE', 'A_KLASSE', 'KREISKLASSE', 'KREISLIGA', 'BEZIRKSLIGA', 
  'BEZIRKSOBERLIGA', 'LANDESLIGA', 'BAYERNLIGA', 'REGIONALLIGA', 
  'DRITTE_LIGA', 'ZWEITE_BUNDESLIGA', 'ERSTE_BUNDESLIGA'
]

const DAMEN_STRENGTH: Strength[] = [
  'A_KLASSE', 'KREISKLASSE', 'KREISLIGA', 'BEZIRKSLIGA', 'BEZIRKSOBERLIGA', 
  'LANDESLIGA', 'BAYERNLIGA', 'REGIONALLIGA', 
  'ZWEITE_BUNDESLIGA', 'ERSTE_BUNDESLIGA'
]

const FREIZEITLIGA_STRENGTH: Strength[] = BASIC_STRENGTH

export function getAvailableStrengths(ageCategory: AgeCategory | null | undefined, subAge: SubAge | SubAge[] | null | undefined): Strength[] {
  if (!ageCategory) return []
  
  if (ageCategory === 'JUNIOREN') {
    const ages = Array.isArray(subAge) ? subAge : [subAge]
    const minAge = ages.reduce((min, age) => {
      if (!age || typeof age !== 'string') return min
      const match = age.match(/^U(\d+)$/)
      if (!match) return min
      const num = parseInt(match[1], 10)
      return num < min ? num : min
    }, 99)
    
    if (minAge <= 11) return JUNIOREN_U6_U11
    if (minAge <= 13) return JUNIOREN_U12_U13
    if (minAge <= 15) return JUNIOREN_U14_U15
    return JUNIOREN_U16_U19
  }
  
  if (ageCategory === 'JUNIORINNEN') {
    const ages = Array.isArray(subAge) ? subAge : [subAge]
    const minAge = ages.reduce((min, age) => {
      if (!age || typeof age !== 'string') return min
      const match = age.match(/^U(\d+)$/)
      if (!match) return min
      const num = parseInt(match[1], 10)
      return num < min ? num : min
    }, 99)
    
    if (minAge <= 11) return JUNIORINNEN_U6_U11
    if (minAge <= 15) return JUNIORINNEN_U12_U15
    return JUNIORINNEN_U16_U19
  }
  
  if (ageCategory === 'HERREN') return HERREN_STRENGTH
  if (ageCategory === 'DAMEN') return DAMEN_STRENGTH
  if (ageCategory === 'FREIZEITLIGA') return FREIZEITLIGA_STRENGTH
  
  return []
}

export function getStrengthOrder(): Strength[] {
  return [
    ...BASIC_STRENGTH,
    'GRUPPE', 'C_KLASSE', 'B_KLASSE', 'A_KLASSE', 'KREISKLASSE', 'KREISLIGA',
    'BEZIRKSLIGA', 'BEZIRKSOBERLIGA', 'LANDESLIGA', 'FOERDERLIGA', 'BAYERNLIGA', 
    'REGIONALLIGA', 'NLZ_LIGA', 'DRITTE_LIGA', 'ZWEITE_BUNDESLIGA', 'ERSTE_BUNDESLIGA'
  ]
}

export function getSubAgesByCategory(category: AgeCategory | null | undefined): SubAge[] {
  if (!category) return []
  switch (category) {
    case 'JUNIOREN': return JUNIOREN_AGES
    case 'JUNIORINNEN': return JUNIORINNEN_AGES
    case 'HERREN': return HERREN_AGES
    case 'DAMEN': return DAMEN_AGES
    case 'FREIZEITLIGA': return FREIZEIT_AGES
    default: return []
  }
}

export const AGE_CATEGORIES: AgeCategory[] = ['JUNIOREN', 'JUNIORINNEN', 'HERREN', 'DAMEN', 'FREIZEITLIGA']

// ========== PLAYFORMAT CONFIGURATION ==========

export type PlayFormat = 
  | 'FUSSBALL_3' | 'FUNINO' | 'FUSSBALL_4' | 'FUSSBALL_5' 
  | 'FUSSBALL_7' | 'FUSSBALL_9' | 'NEUN_GEGEN_NEUN' | 'ELF_GEGEN_ELF'

export const PLAYFORMAT_LABEL: Record<PlayFormat, string> = {
  FUSSBALL_3: 'Fußball 3',
  FUNINO: 'Funino',
  FUSSBALL_4: 'Fußball 4',
  FUSSBALL_5: 'Fußball 5',
  FUSSBALL_7: 'Fußball 7',
  FUSSBALL_9: 'Fußball 9',
  NEUN_GEGEN_NEUN: '9 vs. 9 (Kompaktfeld)',
  ELF_GEGEN_ELF: '11 vs. 11 (Großfeld)',
}

// Junioren & Juniorinnen bis U10: Fußball 3, 4, 5, 7
const YOUTH_U6_U10: PlayFormat[] = ['FUSSBALL_3', 'FUNINO', 'FUSSBALL_4', 'FUSSBALL_5', 'FUSSBALL_7']

// U11: Fußball 3, 4, 5, 7, 9
const YOUTH_U11: PlayFormat[] = ['FUSSBALL_3', 'FUNINO', 'FUSSBALL_4', 'FUSSBALL_5', 'FUSSBALL_7', 'FUSSBALL_9']

// Ab U12: Fußball 7, 9 vs. 9, 11 vs. 11
const YOUTH_U12_PLUS: PlayFormat[] = ['FUSSBALL_7', 'NEUN_GEGEN_NEUN', 'ELF_GEGEN_ELF']

// Herren/Damen/Freizeitliga: Kleinfeld (7 vs. 7), Kompaktfeld (9 vs. 9), Großfeld (11 vs. 11)
const SENIOR_PLAYFORMAT: PlayFormat[] = ['FUSSBALL_7', 'NEUN_GEGEN_NEUN', 'ELF_GEGEN_ELF']

export function getAvailablePlayFormats(ageCategory: AgeCategory | null | undefined, subAge: SubAge | SubAge[] | null | undefined): PlayFormat[] {
  if (!ageCategory) return []
  
  if (ageCategory === 'JUNIOREN' || ageCategory === 'JUNIORINNEN') {
    const ages = Array.isArray(subAge) ? subAge : [subAge]
    const minAge = ages.reduce((min, age) => {
      if (!age || typeof age !== 'string') return min
      const match = age.match(/^U(\d+)$/)
      if (!match) return min
      const num = parseInt(match[1], 10)
      return num < min ? num : min
    }, 99)
    
    if (minAge === 11) return YOUTH_U11
    if (minAge < 11) return YOUTH_U6_U10
    return YOUTH_U12_PLUS
  }
  
  // Herren, Damen, Freizeitliga
  return SENIOR_PLAYFORMAT
}

export function getPlayFormatOrder(): PlayFormat[] {
  return [
    'FUSSBALL_3', 'FUNINO', 'FUSSBALL_4', 'FUSSBALL_5', 
    'FUSSBALL_7', 'FUSSBALL_9', 'NEUN_GEGEN_NEUN', 'ELF_GEGEN_ELF'
  ]
}
