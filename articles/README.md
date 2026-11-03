# כתבות

כתבה לכל תגלית. ארבע לטבלה המחזורית כרשת (`public/articles`) ושמונה ל-BIOMATIC (`public/articles` בריפו שלה).

- התוכן: `content.mjs`. כל מספר בו נלקח מ-`facts.json` ו-`nature.json`, שהופקו ממנועי האפליקציה.
- ההפקה: `node articles/build.mjs <tavla|biomatic> <outDir> <baseUrl>`. מייצר HTML בעיצוב המאמר הקבוע (A4, אפורים מבהיר לכהה, תמונות בצבע ברוחב חתך הזהב), PDF דרך Playwright, ו-Word דרך `docx_build.py`.
- האיורים (`public/articles/img/render-*.jpg`) הם צילומים של ספר החוקים התלת־ממדי, ומסומנים "הדמיה".
- בכל שינוי בנתונים: להפיק מחדש את העובדות, לעדכן את המספרים ב-`content.mjs`, ולהריץ את ההפקה לשתי האפליקציות.
