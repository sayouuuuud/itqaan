import json
import sys

# Titles reported as failing
problematic_titles = [
    "الأربعون الكتابية",
    "إشراق المصابيح لجلسة صلاة التراويح",
    "السراج الوهاج من عبر ودروس الإسراء والمعراج", # User list said this succeeded? Wait.
    "الاماليح لجلسة صلاة التراويح",
    "الدرر البهية من المقدمات المنبرية",
    "الأربعون الرمضانية من أحاديث خير البرية",
    "مشكاة المصابيح لجلسة صلاة التراويح",
    "الخطب و المواعظ الباهرة في ذكر الموت و أهوال المقبرة",
    "المواعظ العصرية للدروس الرمضانية",
    "فيض الرحمن دروس وخواطر شهر رمضان"
]

# Note: "السراج الوهاج..." was marked "تم الاستيراد بنجاح" in user message?
# Let's double check user message.
# "السراج الوهاج من عبر ودروس الإسراء والمعراج ... تم الاستيراد بنجاح"
# So I should NOT include it.

filtered_titles = [
    "الأربعون الكتابية",
    "إشراق المصابيح لجلسة صلاة التراويح",
    "الاماليح لجلسة صلاة التراويح",
    "الدرر البهية من المقدمات المنبرية",
    "الأربعون الرمضانية من أحاديث خير البرية",
    "مشكاة المصابيح لجلسة صلاة التراويح",
    "الخطب و المواعظ الباهرة في ذكر الموت و أهوال المقبرة",
    "المواعظ العصرية للدروس الرمضانية",
    "فيض الرحمن دروس وخواطر شهر رمضان"
]

input_path = "d:\\Imam\\imam-selective-2026-01-19.json"
output_path = "d:\\Imam\\fixed_books_import.json"

try:
    with open(input_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    all_books = data.get('data', {}).get('books', [])
    fixed_books = []

    print(f"Total books in source: {len(all_books)}")

    for book in all_books:
        if book.get('title') in filtered_titles:
            print(f"Found failing book: {book.get('title')}")
            # Fix the issue: set category_id to None/null
            book['category_id'] = None
            fixed_books.append(book)

    # Create new JSON structure
    new_data = {
        "version": data.get("version"),
        "type": "selective_backup",
        "exported_at": data.get("exported_at"),
        "selected_tables": ["books"],
        "data": {
            "books": fixed_books
        }
    }

    print(f"Extracted and fixed {len(fixed_books)} books.")

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(new_data, f, ensure_ascii=False, indent=2)

    print(f"Saved fixed JSON to {output_path}")

except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
