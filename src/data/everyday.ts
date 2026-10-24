// How each element meets us in the physical world: state at room temperature,
// what a real sample looks like, and where we use it every day.

export type Kind = 'metal' | 'semi' | 'crystal' | 'powder' | 'gas' | 'liquid' | 'synth'
export type State = 's' | 'l' | 'g'

export interface Everyday {
  state: State
  kind: Kind
  look: string        // colour of a real sample
  glow?: string       // gases: the colour we actually see (discharge tube, sign)
  rough: number       // surface roughness for rendering, 0 = mirror
  uses: string[]
}

export const KIND_LABEL: Record<Kind, string> = {
  metal: 'מתכת מוצקה', semi: 'מוצק מבריק למחצה', crystal: 'גביש', powder: 'אבקה',
  gas: 'גז', liquid: 'נוזל', synth: 'אין דגימה שאפשר להחזיק',
}
export const STATE_LABEL: Record<State, string> = { s: 'מוצק', l: 'נוזל', g: 'גז' }

// sym | state | kind | look | glow | roughness | uses (separated by ·)
const RAW = `
H|g|gas|#eef3ff|#ff5c9a|0|מים: שני אטומי מימן בכל מולקולה · דלק לתאי דלק ולטילים · הקשחת שמנים למרגרינה
He|g|gas|#f6f2ff|#ffb27a|0|בלוני יום הולדת · קירור המגנט במכשיר MRI · גז נשימה לצוללנים
Li|s|metal|#cfcfc6||0.45|סוללת הטלפון והרכב החשמלי · תרופה לאיזון מצב רוח · כלי קרמיקה עמידים לחום
Be|s|metal|#a9adb2||0.3|קפיצים מנחושת-בריליום · חלונות לקרני רנטגן · מראות הטלסקופ ג'יימס ווב
B|s|semi|#3b3532||0.35|זכוכית פיירקס לאפייה · בורקס לניקוי · סיבים בציוד ספורט
C|s|crystal|#1d1d20||0.5|כל מולקולה בגוף · גרפיט בעיפרון · יהלום · פלדה
N|g|gas|#eef4ff|#8f7bff|0|78% מהאוויר שאנחנו נושמים · דשנים · גז שממלא שקיות חטיפים
O|g|gas|#e8f2ff|#a9dcff|0|נשימה · מים · חמצן רפואי בבית החולים
F|g|gas|#f1ef9e||0|פלואוריד במשחת שיניים · ציפוי טפלון במחבת · תרופות רבות
Ne|g|gas|#fff1e8|#ff4a1c|0|שלטי ניאון · נורות חיווי
Na|s|metal|#d2d2ca||0.4|מלח שולחן · סודה לשתייה · פנסי רחוב צהובים
Mg|s|metal|#c3c5c7||0.3|כלורופיל בעלים · גוף מחשבים ניידים ומצלמות · תוסף תזונה
Al|s|metal|#d6d8da||0.22|פחיות משקה · נייר כסף · מסגרות חלונות ומטוסים
Si|s|semi|#5c616c||0.2|שבבי מחשב · חול וזכוכית · פאנלים סולאריים · סיליקון לאיטום
P|s|powder|#b5322a||0.9|ראש גפרור · עצמות ו-DNA · דשנים · חומצה זרחתית בקולה
S|s|crystal|#e9d43c||0.55|גיפור צמיגים · אבק שריפה · הריח של ביצה ושום
Cl|g|gas|#cfe47a||0|חיטוי מי בריכה ומי ברז · מלח שולחן · צינורות PVC
Ar|g|gas|#f3edff|#c484ff|0|ממלא נורות להט · ריתוך · חלונות בידוד כפולים
K|s|metal|#cac8c0||0.45|בננות · דשן אשלג · תחליף מלח
Ca|s|metal|#d0d0c9||0.4|עצמות ושיניים · חלב · גיר, שיש ומלט
Sc|s|metal|#d2d2ce||0.3|מסגרות אופניים קלות · מנורות אצטדיון
Ti|s|metal|#babec2||0.3|שתלים רפואיים ודנטליים · צבע לבן וקרם הגנה (TiO₂) · מטוסים
V|s|metal|#b2b6ba||0.3|כלי עבודה מפלדת כרום-ונדיום · סוללות זרימה לאגירת חשמל
Cr|s|metal|#dadee4||0.08|ציפוי כרום בברזים ובאופנועים · נירוסטה
Mn|s|metal|#aaa8a4||0.4|פלדה · סוללות אלקליין · אנזימים בגוף
Fe|s|metal|#9c9ea2||0.35|המוגלובין בדם · פלדה במבנים וברכב · מחבת ברזל
Co|s|metal|#a6aab2||0.25|סוללות ליתיום · כחול בקרמיקה ובזכוכית · ויטמין B12
Ni|s|metal|#bab6aa||0.2|מטבעות · נירוסטה · סוללות נטענות
Cu|s|metal|#c86c3f||0.2|חוטי חשמל · צנרת מים · מטבעות
Zn|s|metal|#aab2ba||0.3|ציפוי פלדה מגולוונת · קרם הגנה · מערכת החיסון
Ga|s|metal|#c2c6ca||0.1|נורות LED · שבבי תקשורת בטלפון · נמס בכף היד
Ge|s|semi|#7c8086||0.15|סיבים אופטיים · עדשות לראיית לילה
As|s|semi|#707478||0.3|שבבי GaAs בטלפונים · שימור עץ בעבר · רעל ידוע
Se|s|powder|#7a2c2c||0.6|שמפו נגד קשקשים · מכונות צילום · נוגד חמצון בגוף
Br|l|liquid|#7b1e0f||0|מעכבי בעירה בריהוט ובמחשבים · חיטוי ג'קוזי · מופק מים המלח
Kr|g|gas|#f5f3ff|#e9f1ff|0|נורות הבזק לצילום · בידוד חלונות
Rb|s|metal|#cac6ba||0.45|שעונים אטומיים · זיקוקים סגולים
Sr|s|metal|#d0cbc1||0.4|זיקוקים אדומים · משחת שיניים לשיניים רגישות
Y|s|metal|#cacdd2||0.3|לייזרים · צבע אדום במסכים · מוליכי-על
Zr|s|metal|#c2c6ca||0.25|סכיני קרמיקה · כתרים לשיניים · כורים גרעיניים
Nb|s|metal|#aaaeb6||0.25|מגנטים במכשירי MRI · עגילים ופירסינג
Mo|s|metal|#aaaeb2||0.25|פלדה חזקה בכלים ובצנרת · שמן סיכה יבש
Tc|s|synth|#aaaeb2||0.3|דימות רפואי: מיפוי עצמות
Ru|s|metal|#babec2||0.2|כוננים קשיחים · מגעים חשמליים
Rh|s|metal|#d6dade||0.06|ממיר קטליטי ברכב · ציפוי תכשיטי זהב לבן
Pd|s|metal|#cac8c2||0.15|ממיר קטליטי · סתימות שיניים
Ag|s|metal|#e4e6e8||0.06|תכשיטים וסכו"ם · מגעים במעגלים · חבישות אנטי-בקטריאליות
Cd|s|metal|#babec6||0.25|סוללות ניקל-קדמיום בעבר · פיגמנטים צהובים ואדומים
In|s|metal|#c2c6ce||0.2|שכבה שקופה במסך המגע (ITO) · הלחמות
Sn|s|metal|#cacdd2||0.2|פחיות שימורים · הלחמה במעגלים · ארד
Sb|s|semi|#9ca0a6||0.25|מעכבי בעירה · סוללות עופרת
Te|s|semi|#8c9096||0.25|פאנלים סולאריים CdTe · דיסקים צריבים
I|s|crystal|#3b2c4c||0.25|מלח מועשר ביוד · חיטוי פצעים · בלוטת התריס
Xe|g|gas|#f1f5ff|#8fb2ff|0|פנסי קסנון ברכב · הרדמה · מנועי חלליות
Cs|s|metal|#d8c88e||0.35|שעונים אטומיים ו-GPS · נוזלי קידוח
Ba|s|metal|#c6c6be||0.4|תמיסת בריום לצילום רנטגן · זיקוקים ירוקים
La|s|metal|#cacec9||0.3|עדשות מצלמה · אבן מצית · סוללות של רכב היברידי
Ce|s|metal|#cac6ba||0.35|אבן מצית · ממיר קטליטי · ליטוש זכוכית
Pr|s|metal|#c2c6ba||0.35|משקפי מגן לריתוך · מגנטים
Nd|s|metal|#c2c2c6||0.3|מגנטים חזקים ברמקולים, באוזניות ובמנועי רכב חשמלי
Pm|s|synth|#c2c2c6||0.3|סוללות גרעיניות זעירות · צבע זוהר בעבר
Sm|s|metal|#cac6ba||0.3|מגנטים עמידים לחום · טיפול בסרטן העצם
Eu|s|metal|#cac6b2||0.35|הזוהר האדום במסכים · סימני אבטחה בשטרות אירו
Gd|s|metal|#c6c6ca||0.3|חומר ניגוד בבדיקת MRI
Tb|s|metal|#c6caca||0.3|הזוהר הירוק במסכים ובנורות חסכוניות
Dy|s|metal|#c6c6c2||0.3|מגנטים במנועי רכב חשמלי
Ho|s|metal|#c6c6c2||0.3|לייזר רפואי לפירוק אבנים בכליות
Er|s|metal|#c6c6ca||0.3|מגברים בסיבים אופטיים · לייזר להסרת שיער
Tm|s|metal|#c6c6ca||0.3|מכשירי רנטגן ניידים
Yb|s|metal|#cacac6||0.3|שעונים אטומיים מדויקים · לייזרים תעשייתיים
Lu|s|metal|#cacdd2||0.3|סריקות PET · טיפול בסרטן הערמונית
Hf|s|metal|#babec2||0.25|שבבי מחשב מתקדמים · מוטות בקרה בכורים
Ta|s|metal|#a2a6b2||0.25|קבלים זעירים בטלפון · שתלים רפואיים
W|s|metal|#9ea2a6||0.3|חוט להט בנורות · מקדחים · משקולות
Re|s|metal|#b2b6ba||0.2|להבי טורבינה במנועי סילון
Os|s|metal|#aab2c2||0.15|קצות עטים נובעים
Ir|s|metal|#d2d6da||0.1|מצתים ברכב · אב-טיפוס הקילוגרם
Pt|s|metal|#dadad6||0.08|ממיר קטליטי · תכשיטים · תרופות כימותרפיה
Au|s|metal|#e8b84a||0.08|תכשיטים · מגעים במחברים ובמעגלים · ציפוי לוויינים
Hg|l|liquid|#b9bec6||0|מדחום בעבר · נורות פלורסנט · סתימות אמלגם
Tl|s|metal|#babec2||0.3|סריקת לב בעבר · רעל
Pb|s|metal|#8c9098||0.4|מצבר הרכב · סינר מגן בצילום רנטגן
Bi|s|metal|#cabaca||0.15|תרופות לקיבה · ברק בקוסמטיקה
Po|s|synth|#a2a6aa||0.3|מנטרלי חשמל סטטי בתעשייה
At|s|synth|#444448||0.3|ניסויים בטיפול בסרטן
Rn|g|gas|#f2f2ff|#ff8a8a|0|גז רדיואקטיבי שמצטבר במרתפים · בדיקת בטיחות בבתים
Fr|s|synth|#c2c2c2||0.3|מחקר בלבד
Ra|s|synth|#cacac6||0.3|טיפול בסרטן · מחוגים זוהרים בשעונים ישנים
Ac|s|synth|#c2c6ca||0.3|טיפול ממוקד בסרטן
Th|s|metal|#aaaeaa||0.35|רשתות זוהרות בפנסי גז · דלק גרעיני עתידי
Pa|s|synth|#b2b6b6||0.3|מחקר בלבד
U|s|metal|#8c928a||0.35|דלק בתחנות כוח גרעיניות · זכוכית אורניום זוהרת
Np|s|synth|#aaaeb2||0.3|תוצר לוואי בכורים גרעיניים
Pu|s|synth|#aaa6a2||0.35|סוללות גרעיניות בחלליות · נשק גרעיני
Am|s|synth|#c2c2c6||0.3|גלאי עשן ביתי
Cm|s|synth|#c2c2c6||0.3|מכשירי מדידה ברוברים במאדים
Cf|s|synth|#c2c2c6||0.3|מקור נויטרונים לגילוי מתכות ונפט
`

const SYNTH_ONLY = 'Bk Es Fm Md No Lr Rf Db Sg Bh Hs Mt Ds Rg Cn Nh Fl Mc Lv Ts Og'.split(' ')

export const EVERYDAY = new Map<string, Everyday>()
for (const line of RAW.trim().split('\n')) {
  const [sym, state, kind, look, glow, rough, uses] = line.split('|')
  EVERYDAY.set(sym, { state: state as State, kind: kind as Kind, look, glow: glow || undefined, rough: Number(rough), uses: uses.split(' · ') })
}
for (const sym of SYNTH_ONLY)
  EVERYDAY.set(sym, { state: 's', kind: 'synth', look: '#9aa0b0', rough: 0.3, uses: ['נוצר רק במאיץ חלקיקים, כמה אטומים בכל פעם · מתפרק תוך שברירי שנייה עד ימים'] })

// Everyday objects are hyperedges: each one connects the elements it is made of.
export interface Thing { id: string; name: string; about: string; els: string[] }

export const THINGS: Thing[] = [
  { id: 'phone', name: 'סמארטפון', about: 'כשבעים יסודות שונים בכיס אחד. הסוללה, המסך, השבבים, הרמקול והרטט.',
    els: 'Li Co C Al Si Cu Au Ag Sn In Ga As Ta Nd Pr Dy Tb Eu Y Gd Ni Mg O Ge Er Hf Ru'.split(' ') },
  { id: 'body', name: 'גוף האדם', about: 'ארבעה יסודות הם 96% מהמסה. השאר זעירים, אבל בלעדיהם אין חיים.',
    els: 'O C H N Ca P K S Na Cl Mg Fe Zn Cu I Se Mn Co Mo F'.split(' ') },
  { id: 'kitchen', name: 'מטבח', about: 'מלח, סירים, נירוסטה, זכוכית לאפייה וסכיני קרמיקה.',
    els: 'Na Cl Fe Al Cr Ni Sn Cu C O H K Ca B Zr Ti Si Mg'.split(' ') },
  { id: 'ev', name: 'רכב חשמלי', about: 'פלדה ואלומיניום בגוף, נחושת בכבלים, ליתיום וקובלט בסוללה, ומגנטים נדירים במנוע.',
    els: 'Fe Al Cu Li Ni Co Mn Nd Dy Pr Tb C Si Cr Mo Pb S O Ga'.split(' ') },
  { id: 'car', name: 'רכב בנזין', about: 'הממיר הקטליטי מחזיק שלוש מתכות יקרות. המצבר הוא עופרת וחומצה.',
    els: 'Fe Al Cu Pt Pd Rh Ce Pb S Cr Mo Ir C H O Zn Ni'.split(' ') },
  { id: 'home', name: 'בית ובניין', about: 'מלט, זכוכית, פלדה, חוטי חשמל, צבע לבן וגלאי עשן.',
    els: 'Ca Si O Fe Al Cu Ti Cl Zn W Am C H Mg Na'.split(' ') },
  { id: 'hospital', name: 'בית חולים', about: 'דימות, הרדמה, שתלים וטיפולים. כאן פוגשים את היסודות הנדירים ביותר.',
    els: 'Gd Tc Ba I O He Ti Nb Ag Pt Lu Ho Xe Co Ra Ac Tm'.split(' ') },
  { id: 'light', name: 'אור ומסכים', about: 'נורות, שלטים, לדים ומסכים. כל צבע הוא יסוד אחר.',
    els: 'W Ar Ne Xe Kr Hg Eu Tb Y Ga In N Na He'.split(' ') },
  { id: 'fireworks', name: 'זיקוקים', about: 'כל צבע בשמיים הוא יסוד שבוער: אדום, ירוק, כחול, צהוב וסגול.',
    els: 'Sr Ba Cu Na Rb K S C Mg Al Ti Li Ca Cl'.split(' ') },
]

/** Daily-life context for the starter compounds in the lab. */
export const COMPOUND_LIFE: Record<string, string> = {
  GaAs: 'שבבי תקשורת בטלפון ותאים סולאריים בלוויינים',
  MoS2: 'שמן סיכה יבש, וטרנזיסטורים דקים באטום אחד',
  NaCl: 'מלח שולחן',
  TiO2: 'צבע לבן, קרם הגנה ומשחת שיניים',
  MgB2: 'מוליך-על זול לכבלים ולמגנטים',
  CdTe: 'פאנלים סולאריים דקים',
  LaB6: 'מקור האלקטרונים במיקרוסקופים אלקטרוניים',
  SiC: 'נייר לטש, ושבבי הספק ברכב חשמלי',
  Bi2Te3: 'קירור תרמואלקטרי במקררים ניידים',
  Li3N: 'מוליך יונים לסוללות',
  ZnO: 'קרם הגנה ומשחות לעור',
  Fe2O3: 'חלודה, ופיגמנט אדום',
  CaCO3: 'גיר ושיש',
  SiO2: 'חול וזכוכית',
  Al2O3: 'אבן ספיר ונייר לטש',
  GaN: 'נורות LED לבנות ומטענים מהירים',
  WC: 'מקדחים וכלי חיתוך',
  CdSe: 'נקודות קוונטיות במסכי QLED',
}
