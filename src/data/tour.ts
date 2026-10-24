// סיור מודרך: כל צעד קובע סידור, צביעה, שכבות ויסודות מודגשים, ומסביר מה לראות.
import type { ModelId } from "./models";
import type { ColorMode } from "./elements";

export type Step = {
  model: ModelId; color: ColorMode; title: string; text: string;
  layers?: Partial<{ thread: boolean; families: boolean; links: boolean; guides: boolean }>;
  highlight?: number[]; filter?: string;
};

export const TOUR: Step[] = [
  { model: "classic", color: "category", layers: { thread: true }, title: "הבעיה: רצף קטוע",
    text: "החוט הצבעוני עובר מיסוד ליסוד לפי המספר האטומי. בטבלה המוכרת הוא נשבר בסוף כל שורה, וצונח לתחתית בלנתן (57) ובאקטיניום (89)." },
  { model: "chancourtois", color: "category", layers: { thread: true, guides: true }, highlight: [3, 11, 19, 8, 16], title: "1862: הסליל הראשון",
    text: "דה שנקורטואה כרך את היסודות לפי המסה על גליל, 16 יחידות לסיבוב. ליתיום, נתרן ואשלגן, וגם חמצן וגופרית, נופלים על אותו קו אנכי." },
  { model: "stedman", color: "category", layers: { families: true, guides: true }, title: "1947: הקונוס",
    text: "המימן בקודקוד וכל מחזור טבעת רחבה יותר. קווי המשפחה יורדים לאורך המעטפת: כל קבוצה ראשית היא קרן אחת." },
  { model: "benfey", color: "block", layers: { thread: true, guides: true }, title: "1964: ספירלה רציפה",
    text: "אצל בנפיי החוט לא נקטע אף פעם. בלוק d (צהוב) ובלוק f (סגול) בולטים כחצאי איים, ולכן המחזורים גדלים בלי לשבור את הרצף." },
  { model: "janet", color: "block", layers: {}, title: "1928: הצעד השמאלי",
    text: "שורה לכל ערך של n+l. כל בלוק הוא מלבן שלם, בלי שורות נשלפות. ההליום עובר לבלוק s, מעל הבריליום." },
  { model: "stowe", color: "block", layers: { guides: true }, title: "1989: שלושה מספרים קוונטיים",
    text: "סטו הפך את מכניקת הקוונטים לצירים: גובה הוא n, עומק הוא l ורוחב הוא m. כל קומה היא קליפה עם 2n² מקומות." },
  { model: "adomah", color: "block", layers: { guides: true }, title: "2006: טטרהדרון ADOMAH",
    text: "השכבות לפי n+l באות בזוגות ומתרחבות: 2, 8, 18, 32. מכל שכבה קוראים ישירות את תפוסת האורביטלים s, p, d ו-f." },
  { model: "tree", color: "category", layers: { links: true, guides: true }, highlight: [3, 12, 4, 13, 5, 14, 30, 50, 48, 82, 47, 81], title: "מחזוריות משנית",
    text: "בעץ השכבות מתגלים קשרים בין יסודות רחוקים: יחסים אלכסוניים (כתום) ו'מהלך הפרש' (ורוד). אלה דוגמאות מהספרות, לא רשימה מלאה." },
  { model: "classic", color: "eneg", layers: { thread: false }, title: "בחזרה לטבלה, עם עיניים חדשות",
    text: "אותם נתונים, צבועים לפי אלקטרושליליות. עכשיו נסו בעצמכם: החליפו סידור וצביעה, ולחצו על יסוד כדי לראות איפה הוא יושב בכל אחד מהם." },
];
