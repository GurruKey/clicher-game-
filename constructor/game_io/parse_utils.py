import re


def parse_item_blocks(body: str) -> list[tuple[str, str]]:
    items: list[tuple[str, str]] = []
    i = 0
    length = len(body)

    while i < length:
        while i < length and body[i] in " \t\r\n,":
            i += 1
        if i >= length:
            break

        start = i
        while i < length and (body[i].isalnum() or body[i] == "_"):
            i += 1
        key = body[start:i].strip()
        if not key:
            break

        while i < length and body[i].isspace():
            i += 1
        if i >= length or body[i] != ":":
            break
        i += 1

        while i < length and body[i].isspace():
            i += 1
        if i >= length or body[i] != "{":
            break

        level = 0
        block_start = i
        while i < length:
            if body[i] == "{":
                level += 1
            elif body[i] == "}":
                level -= 1
            i += 1
            if level == 0:
                block = body[block_start + 1 : i - 1]
                items.append((key, block))
                break

    return items


def extract_field(block: str, field: str) -> str | None:
    # UPDATED: Support both single and double quotes using backreference
    match = re.search(rf"{field}\s*:\s*([\"'])(.*?)\1", block)
    if match:
        return match.group(2)
    return None


def extract_number(block: str, field: str) -> int | None:
    match = re.search(rf"{field}\s*:\s*([0-9]+)", block)
    if match:
        return int(match.group(1))
    return None


def extract_float(block: str, field: str) -> float | None:
    match = re.search(rf"{field}\s*:\s*([0-9.+-]+)", block)
    if match:
        return float(match.group(1))
    return None


def extract_icon_var(block: str) -> str | None:
    match = re.search(r"icon\s*:\s*([A-Za-z0-9_]+)", block)
    if match:
        return match.group(1)
    return None


def extract_asset_var(block: str, field: str) -> str | None:
    match = re.search(rf"{field}\s*:\s*([A-Za-z0-9_]+)", block)
    if match:
        return match.group(1)
    return None


def extract_export_block(text: str) -> str | None:
    match = re.search(r"export\s+const\s+\w+\s*=\s*\{", text)
    if not match:
        return None

    start = match.end() - 1
    level = 0
    end = None
    for index in range(start, len(text)):
        char = text[index]
        if char == "{":
            level += 1
        elif char == "}":
            level -= 1
            if level == 0:
                end = index
                break

    if end is None:
        return None
    return text[start + 1 : end]
