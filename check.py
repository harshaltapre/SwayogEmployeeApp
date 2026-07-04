import re
import sys
files = sys.stdin.read().splitlines()
for file_path in files:
    try:
        with open(file_path, "r") as f: content = f.read()
        open_tags = len(re.findall(r"<label\b", content))
        close_tags = len(re.findall(r"</label>", content))
        if open_tags != close_tags:
            print(f"File: {file_path}")
            print(f"  Open <label>: {open_tags}, Close </label>: {close_tags}")
            lines = content.splitlines()
            for i, line in enumerate(lines):
                if "<label" in line or "</label>" in line:
                    print(f"    {i+1}: {line.strip()}")
            print("-" * 20)
    except Exception as e: pass