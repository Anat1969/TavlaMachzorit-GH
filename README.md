# טבלה מחזורית · מעבדת הצורות

הטבלה המחזורית בשמונה סידורים, במרחב תלת-ממדי אחד: טבלה, סליל, קונוס, ספירלה, צעד שמאלי, מגדל קוונטי, פירמידת ADOMAH ועץ.

## הרצה
```
npm install
npm run dev        # פיתוח
npm run build      # בנייה ל-dist
npm run deploy     # בנייה ודחיפה ל-gh-pages
npm run data -- path/to/PeriodicTableJSON.json   # בניית נתוני היסודות מחדש
```

## מבנה
- `src/data/elements.json` נתוני 118 היסודות, עם שמות בעברית ומספרים קוונטיים (נוצר בסקריפט).
- `src/data/models.ts` מטא-נתונים ופונקציית מיקום לכל סידור.
- `src/scene/Lab.ts` מנוע three: אריחים, מעבר מונפש, חוט Z, קווי משפחה, קשרים משניים.
- `src/pages/` בית, מעבדה (`#/lab/<model>`), מחקר, דף יסוד (`#/element/<z>`), טבלת סיכום (`#/table`).

## החלטות
- כל מיקום מחושב מהנתונים, וכל סידור מסומן ברמת נאמנות למקור.
- מידע משתמש (הערות, סימונים) נשמר מקומית ב-IndexedDB וב-localStorage, עם גיבוי לקובץ.
- three נטען בעצלתיים. בלי WebGL כל המידע זמין בטבלה הנגישה ובטבלת הסיכום.

נתונים: [Periodic-Table-JSON](https://github.com/Bowserinator/Periodic-Table-JSON), CC BY-SA 3.0.
