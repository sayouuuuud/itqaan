import re

def get_keys(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    # Basic regex to find keys like 'key:' or 'key: {' or 'key: "value"'
    # This is a bit naive but should work for the current structure
    keys = set(re.findall(r'(\w+):\s*(?:[\{\'\"]|\[)', content))
    return keys

en_keys = get_keys('e:/itqaan/lib/i18n/locales/en.ts')
ar_keys = get_keys('e:/itqaan/lib/i18n/locales/ar.ts')

print(f"EN Keys: {len(en_keys)}")
print(f"AR Keys: {len(ar_keys)}")

only_en = en_keys - ar_keys
only_ar = ar_keys - en_keys

# Sort them for better readability
print(f"Keys only in EN: {sorted(list(only_en)) if only_en else 'None'}")
print(f"Keys only in AR: {sorted(list(only_ar)) if only_ar else 'None'}")
