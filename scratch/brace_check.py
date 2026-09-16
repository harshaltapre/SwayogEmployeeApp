from pathlib import Path

path = Path(r'E:\SwayogEmployeeApp\android-app\app\src\main\java\com\swayog\employee\presentation\attendance\AttendanceScreen.kt')
text = path.read_text(encoding='utf-8')
stack = []
stack_pos = []
state = 'code'
escape = False
i = 0
while i < len(text):
    ch = text[i]
    nxt = text[i + 1] if i + 1 < len(text) else ''

    if state == 'code':
        if ch == '/' and nxt == '/':
            end = text.find('\n', i)
            i = len(text) if end == -1 else end + 1
            continue
        if ch == '/' and nxt == '*':
            end = text.find('*/', i + 2)
            i = len(text) if end == -1 else end + 2
            continue
        if ch == '"':
            if i + 2 < len(text) and text[i:i+3] == '"""':
                state = 'triple_quote'
                i += 3
                continue
            state = 'string'
            i += 1
            continue
        if ch == "'":
            state = 'char'
            i += 1
            continue
        if ch in '{[(':
            stack.append(ch)
            stack_pos.append(i)
        elif ch in '})]':
            if not stack:
                print(f'extra closing {ch} at index {i}')
                raise SystemExit(1)
            top = stack.pop()
            stack_pos.pop()
            pairs = {'{': '}', '[': ']', '(': ')'}
            if pairs[top] != ch:
                print(f'mismatch: expected {pairs[top]} for {top} before {ch} at index {i}')
                raise SystemExit(1)
        i += 1
        continue

    if state == 'string':
        if escape:
            escape = False
        elif ch == '\\':
            escape = True
        elif ch == '"':
            state = 'code'
        i += 1
        continue

    if state == 'char':
        if escape:
            escape = False
        elif ch == '\\':
            escape = True
        elif ch == "'":
            state = 'code'
        i += 1
        continue

    if state == 'triple_quote':
        if text.startswith('"""', i):
            state = 'code'
            i += 3
        else:
            i += 1

print('remaining open count:', len(stack))
print('last open positions:', stack_pos[-10:])
for pos in stack_pos[-10:]:
    line = text.count('\n', 0, pos) + 1
    snippet_start = max(0, pos - 180)
    snippet_end = min(len(text), pos + 180)
    print('--- at line', line)
    print(text[snippet_start:snippet_end].replace('\n', '\\n'))
