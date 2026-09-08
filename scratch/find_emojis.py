import os
import re

emoji_pattern = re.compile(
    r'[\U00010000-\U0010ffff]|[\u2600-\u27BF]|[\u2300-\u23FF]|[\u2B50\u2B55\u2934\u2935\u25AA\u25AB\u25B6\u25C0\u25FB-\u25FE]'
)

targets = ['android-app', 'src', 'public', 'index.html', 'backend', 'api']
results = []
for target in targets:
    if os.path.isfile(target):
        with open(target, 'r', encoding='utf-8', errors='ignore') as f:
            for line_no, line in enumerate(f, 1):
                if emoji_pattern.search(line):
                    results.append((target, line_no, line.strip()))
    elif os.path.isdir(target):
        for root, dirs, files in os.walk(target):
            if any(p in root for p in ['node_modules', '.git', 'build', '.gradle', 'dist']):
                continue
            for file in files:
                if file.endswith(('.kt', '.java', '.xml', '.ts', '.tsx', '.js', '.jsx', '.html', '.css', '.json')):
                    filepath = os.path.join(root, file)
                    try:
                        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                            for line_no, line in enumerate(f, 1):
                                if emoji_pattern.search(line):
                                    results.append((filepath, line_no, line.strip()))
                    except Exception as e:
                        pass

print(f"Total matches found: {len(results)}")
for r in results:
    print(f"{r[0]}:{r[1]}: {r[2]}")
