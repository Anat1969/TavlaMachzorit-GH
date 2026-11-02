// Challenges from the BIOMATIC app (https://biomatic-weld.vercel.app), each tied to the material
// property that answers it and to binary compounds that already have that property in practice.
// The nature lines are quoted from BIOMATIC's data; the material facts are standard materials science.
export interface Challenge {
  id: string
  path: string          // BIOMATIC route: topic/sub
  title: string         // the challenge, as BIOMATIC names it
  nature: string        // the source in nature
  trick: string         // what nature does, in one line (BIOMATIC)
  needs: string         // the property a material needs, in plain words
  parents: { f: string; does: string }[] // compounds that do it today, and what they do
  test: string          // the function check, in plain words (implemented in src/lib/nature.ts)
}

export const CHALLENGES: Challenge[] = [
  {
    id: 'cool', path: 'climate/envelope-cooling', title: 'קירור מעטפת הבניין',
    nature: 'נמלת הכסף הסהרתית', trick: 'שערות משולשות שמחזירות את השמש ומקרינות חום לשמים',
    needs: 'חומר לבן לאור השמש, שמקרין חום החוצה דרך האטמוספרה',
    parents: [{ f: 'Al2O3', does: 'חלקיקים לבנים בצבעי קירור קרינתי' }, { f: 'SiO2', does: 'מקרין חום בתחום האינפרה־אדום' }, { f: 'MgO', does: 'מחזיר אור ועמיד בחום' }],
    test: 'פער אנרגיה גדול (לבן לשמש), לפחות שלושה רבעים מזה של חומר המוצא',
  },
  {
    id: 'clean-air', path: 'wellbeing/air-filter', title: 'סינון זיהום אוויר',
    nature: 'טיטניום דיאוקסיד', trick: 'אור שמפרק מזהם על פני השטח, והחומר עצמו אינו נצרך',
    needs: 'משטח שאור השמש מפעיל אותו ומפרק מזהמים',
    parents: [{ f: 'TiO2', does: 'פוטוקטליזטור, בטון וצבע מנקים' }, { f: 'ZnO', does: 'פוטוקטליזטור ומסנן UV' }, { f: 'WO3', does: 'פוטוקטליזטור שמגיב גם לאור נראה' }],
    test: 'פער אנרגיה קרוב לזה של חומר המוצא, כי זה מה שקובע איזה אור מפעיל אותו',
  },
  {
    id: 'clean-water', path: 'water/treatment', title: 'טיהור מים',
    nature: 'קרקעית החלוקים', trick: 'מצע מינרלי שמחזיק את מה שעובר דרכו',
    needs: 'משטח שאור השמש מפעיל אותו ומפרק מזהמים במים',
    parents: [{ f: 'TiO2', does: 'מפרק מזהמים אורגניים במים באור' }, { f: 'ZnO', does: 'מפרק צבעים ותרופות במים באור' }],
    test: 'פער אנרגיה קרוב לזה של חומר המוצא',
  },
  {
    id: 'carbon', path: 'wellbeing/carbon', title: 'לכידת פחמן',
    nature: 'בליית הבזלת', trick: 'סלע שמגיב עם פחמן והופך לאבן',
    needs: 'חומר שמגיב עם פחמן דו־חמצני והופך לאבן גיר יציבה',
    parents: [{ f: 'MgO', does: 'נקשר ל-CO₂ והופך למגנזיט' }, { f: 'CaO', does: 'נקשר ל-CO₂ והופך לקלציט' }],
    test: 'תחמוצת של מתכת חשמלית מאוד (משיכת אלקטרונים עד 1.35), כי רק תחמוצת בסיסית נקשרת ל-CO₂',
  },
  {
    id: 'press', path: 'energy/kinetic', title: 'לכידת אנרגיה קינטית',
    nature: 'הגביש הפייזואלקטרי', trick: 'לחיצה שמייצרת מתח',
    needs: 'גביש שמייצר חשמל כשלוחצים עליו',
    parents: [{ f: 'AlN', does: 'פייזואלקטרי בחיישנים ובמסננים בטלפון' }, { f: 'ZnO', does: 'פייזואלקטרי בננו־גנרטורים' }, { f: 'GaN', does: 'פייזואלקטרי ומוליך למחצה' }],
    test: 'גביש בלי מרכז סימטריה, ומבודד. אם יש חישוב פייזואלקטרי, הוא מוצג',
  },
  {
    id: 'sun', path: 'energy/solar', title: 'קצירת אנרגיה סולארית',
    nature: 'מלכודת האור', trick: 'האור נכנס, מוחזר פנימה שוב ושוב, ולא חוזר',
    needs: 'חומר שבולע את אור השמש והופך אותו לזרם',
    parents: [{ f: 'CdTe', does: 'פאנלים סולאריים דקים' }, { f: 'GaAs', does: 'תאים סולאריים בלוויינים' }],
    test: 'פער אנרגיה קרוב לזה של חומר המוצא, בתחום שבולע אור שמש',
  },
  {
    id: 'light', path: 'structure/lightweight', title: 'חומרים קלים וחזקים',
    nature: 'שריון הדיאטומה', trick: 'החומר השביר ביותר, במבנה שאינו שביר',
    needs: 'קרמיקה קלה וקשה מאוד',
    parents: [{ f: 'B4C', does: 'מהחומרים הקשים, במיגון קל' }, { f: 'SiC', does: 'קשה, קל ועמיד בחום' }],
    test: 'צפיפות עד 1.2 מזו של חומר המוצא, וקשיחות גזירה של 100 GPa לפחות כשיש חישוב',
  },
  {
    id: 'dry', path: 'wellbeing/indoor-air', title: 'איכות אוויר פנימית',
    nature: 'גביש המלח', trick: 'מעל אחוז לחות מסוים, המשטח נעשה רטוב',
    needs: 'מלח שמושך לחות מהאוויר ומשחרר אותה בחימום',
    parents: [{ f: 'CaCl2', does: 'סופח לחות במייבשים' }, { f: 'LiCl', does: 'סופח לחות במערכות מיזוג מייבשות' }],
    test: 'מלח כלורי של מתכת חשמלית מאוד (משיכת אלקטרונים עד 1.3), כמו מלחי הייבוש המוכרים',
  },
]

export const BIOMATIC_URL = (path: string) => `https://biomatic-weld.vercel.app/#${path}`
